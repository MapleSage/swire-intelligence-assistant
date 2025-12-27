#!/bin/bash

# Script to configure Azure Cognitive Search index and data sources
# for the Swire Intelligence Assistant knowledge base

set -e

# Configuration
ENVIRONMENT=${1:-dev}
RESOURCE_PREFIX="swire-copilot"
RESOURCE_GROUP_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-rg"
SEARCH_SERVICE_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-search"
STORAGE_ACCOUNT_NAME="${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage"
OPENAI_SERVICE_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-openai"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get search service admin key
get_search_admin_key() {
    az search admin-key show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --service-name "$SEARCH_SERVICE_NAME" \
        --query primaryKey -o tsv
}

# Function to get storage account connection string
get_storage_connection_string() {
    az storage account show-connection-string \
        --name "$STORAGE_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query connectionString -o tsv
}

# Function to get OpenAI endpoint and key
get_openai_info() {
    OPENAI_ENDPOINT=$(az cognitiveservices account show \
        --name "$OPENAI_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query properties.endpoint -o tsv)
    
    OPENAI_KEY=$(az cognitiveservices account keys list \
        --name "$OPENAI_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query key1 -o tsv)
    
    echo "$OPENAI_ENDPOINT|$OPENAI_KEY"
}

# Function to create search index
create_search_index() {
    print_status "Creating Azure Cognitive Search index..."
    
    SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
    ADMIN_KEY=$(get_search_admin_key)
    
    # Update the index definition with actual OpenAI endpoint
    OPENAI_INFO=$(get_openai_info)
    OPENAI_ENDPOINT=$(echo "$OPENAI_INFO" | cut -d'|' -f1)
    
    # Create a temporary index file with updated OpenAI endpoint
    TEMP_INDEX_FILE=$(mktemp)
    sed "s|https://swire-copilot-dev-openai.openai.azure.com|$OPENAI_ENDPOINT|g" cognitive-search-index.json > "$TEMP_INDEX_FILE"
    
    # Create the index
    curl -X PUT \
        "$SEARCH_ENDPOINT/indexes/swire-knowledge-base?api-version=2023-11-01" \
        -H "Content-Type: application/json" \
        -H "api-key: $ADMIN_KEY" \
        -d @"$TEMP_INDEX_FILE"
    
    rm "$TEMP_INDEX_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Search index created successfully"
    else
        print_error "Failed to create search index"
        exit 1
    fi
}

# Function to create data source for SharePoint/OneDrive documents
create_blob_data_source() {
    print_status "Creating blob storage data source..."
    
    SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
    ADMIN_KEY=$(get_search_admin_key)
    STORAGE_CONNECTION=$(get_storage_connection_string)
    
    # Create data source configuration
    cat > datasource-config.json << EOF
{
    "name": "swire-documents-datasource",
    "description": "Data source for Swire enterprise documents",
    "type": "azureblob",
    "credentials": {
        "connectionString": "$STORAGE_CONNECTION"
    },
    "container": {
        "name": "documents",
        "query": null
    },
    "dataChangeDetectionPolicy": {
        "@odata.type": "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
        "highWaterMarkColumnName": "_ts"
    },
    "dataDeletionDetectionPolicy": {
        "@odata.type": "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
        "softDeleteColumnName": "isDeleted",
        "softDeleteMarkerValue": "true"
    }
}
EOF

    # Create the data source
    curl -X PUT \
        "$SEARCH_ENDPOINT/datasources/swire-documents-datasource?api-version=2023-11-01" \
        -H "Content-Type: application/json" \
        -H "api-key: $ADMIN_KEY" \
        -d @datasource-config.json
    
    rm datasource-config.json
    
    if [ $? -eq 0 ]; then
        print_success "Blob data source created successfully"
    else
        print_error "Failed to create blob data source"
        exit 1
    fi
}

# Function to create skillset for document processing
create_skillset() {
    print_status "Creating AI skillset for document processing..."
    
    SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
    ADMIN_KEY=$(get_search_admin_key)
    OPENAI_INFO=$(get_openai_info)
    OPENAI_ENDPOINT=$(echo "$OPENAI_INFO" | cut -d'|' -f1)
    OPENAI_KEY=$(echo "$OPENAI_INFO" | cut -d'|' -f2)
    
    # Create skillset configuration
    cat > skillset-config.json << EOF
{
    "name": "swire-document-skillset",
    "description": "Skillset for processing Swire enterprise documents",
    "skills": [
        {
            "@odata.type": "#Microsoft.Skills.Text.SplitSkill",
            "name": "SplitText",
            "description": "Split text into chunks for processing",
            "context": "/document/content",
            "inputs": [
                {
                    "name": "text",
                    "source": "/document/content"
                },
                {
                    "name": "languageCode",
                    "source": "/document/languageCode"
                }
            ],
            "outputs": [
                {
                    "name": "textItems",
                    "targetName": "pages"
                }
            ],
            "defaultLanguageCode": "en",
            "textSplitMode": "pages",
            "maximumPageLength": 2000,
            "pageOverlapLength": 500
        },
        {
            "@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill",
            "name": "GenerateEmbeddings",
            "description": "Generate embeddings using Azure OpenAI",
            "context": "/document/content/pages/*",
            "resourceUri": "$OPENAI_ENDPOINT",
            "apiKey": "$OPENAI_KEY",
            "deploymentId": "text-embedding-ada-002",
            "inputs": [
                {
                    "name": "text",
                    "source": "/document/content/pages/*"
                }
            ],
            "outputs": [
                {
                    "name": "embedding",
                    "targetName": "vector"
                }
            ]
        },
        {
            "@odata.type": "#Microsoft.Skills.Text.KeyPhraseExtractionSkill",
            "name": "ExtractKeyPhrases",
            "description": "Extract key phrases for tagging",
            "context": "/document/content",
            "inputs": [
                {
                    "name": "text",
                    "source": "/document/content"
                },
                {
                    "name": "languageCode",
                    "source": "/document/languageCode"
                }
            ],
            "outputs": [
                {
                    "name": "keyPhrases",
                    "targetName": "keyPhrases"
                }
            ],
            "defaultLanguageCode": "en"
        }
    ],
    "cognitiveServices": null,
    "knowledgeStore": null
}
EOF

    # Create the skillset
    curl -X PUT \
        "$SEARCH_ENDPOINT/skillsets/swire-document-skillset?api-version=2023-11-01" \
        -H "Content-Type: application/json" \
        -H "api-key: $ADMIN_KEY" \
        -d @skillset-config.json
    
    rm skillset-config.json
    
    if [ $? -eq 0 ]; then
        print_success "AI skillset created successfully"
    else
        print_error "Failed to create AI skillset"
        exit 1
    fi
}

# Function to create indexer
create_indexer() {
    print_status "Creating search indexer..."
    
    SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
    ADMIN_KEY=$(get_search_admin_key)
    
    # Create indexer configuration
    cat > indexer-config.json << EOF
{
    "name": "swire-documents-indexer",
    "description": "Indexer for Swire enterprise documents",
    "dataSourceName": "swire-documents-datasource",
    "targetIndexName": "swire-knowledge-base",
    "skillsetName": "swire-document-skillset",
    "schedule": {
        "interval": "PT1H"
    },
    "parameters": {
        "batchSize": 50,
        "maxFailedItems": 10,
        "maxFailedItemsPerBatch": 5,
        "configuration": {
            "dataToExtract": "contentAndMetadata",
            "parsingMode": "default",
            "indexedFileNameExtensions": ".pdf,.docx,.doc,.txt,.html,.htm,.xml,.json,.csv",
            "excludedFileNameExtensions": ".png,.jpg,.jpeg,.gif,.bmp,.tiff,.zip,.exe"
        }
    },
    "fieldMappings": [
        {
            "sourceFieldName": "metadata_storage_path",
            "targetFieldName": "id",
            "mappingFunction": {
                "name": "base64Encode"
            }
        },
        {
            "sourceFieldName": "metadata_storage_name",
            "targetFieldName": "title"
        },
        {
            "sourceFieldName": "content",
            "targetFieldName": "content"
        },
        {
            "sourceFieldName": "metadata_storage_last_modified",
            "targetFieldName": "lastModified"
        }
    ],
    "outputFieldMappings": [
        {
            "sourceFieldName": "/document/content/pages/*/vector",
            "targetFieldName": "contentVector"
        },
        {
            "sourceFieldName": "/document/content/keyPhrases",
            "targetFieldName": "tags"
        }
    ]
}
EOF

    # Create the indexer
    curl -X PUT \
        "$SEARCH_ENDPOINT/indexers/swire-documents-indexer?api-version=2023-11-01" \
        -H "Content-Type: application/json" \
        -H "api-key: $ADMIN_KEY" \
        -d @indexer-config.json
    
    rm indexer-config.json
    
    if [ $? -eq 0 ]; then
        print_success "Search indexer created successfully"
    else
        print_error "Failed to create search indexer"
        exit 1
    fi
}

# Function to run initial indexing
run_initial_indexing() {
    print_status "Running initial indexing..."
    
    SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
    ADMIN_KEY=$(get_search_admin_key)
    
    # Run the indexer
    curl -X POST \
        "$SEARCH_ENDPOINT/indexers/swire-documents-indexer/run?api-version=2023-11-01" \
        -H "api-key: $ADMIN_KEY"
    
    if [ $? -eq 0 ]; then
        print_success "Initial indexing started successfully"
        print_status "Monitor indexing progress in the Azure portal"
    else
        print_error "Failed to start initial indexing"
        exit 1
    fi
}

# Main execution
main() {
    echo "============================================"
    echo "Azure Cognitive Search Configuration Setup"
    echo "============================================"
    echo "Environment: $ENVIRONMENT"
    echo "Search Service: $SEARCH_SERVICE_NAME"
    echo ""
    
    create_search_index
    create_blob_data_source
    create_skillset
    create_indexer
    run_initial_indexing
    
    echo ""
    print_success "Azure Cognitive Search setup completed!"
    echo ""
    echo "Next Steps:"
    echo "1. Upload documents to the 'documents' container in storage account"
    echo "2. Monitor indexing progress in Azure portal"
    echo "3. Test search functionality"
    echo "4. Configure Microsoft Copilot Studio integration"
}

# Run main function
main