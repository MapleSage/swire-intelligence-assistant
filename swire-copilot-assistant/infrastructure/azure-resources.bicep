// Azure Bicep template for Swire Intelligence Assistant infrastructure
// Deploys all required Azure services in West Europe region for EU compliance

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Location for all resources - must be EU region for compliance')
param location string = 'westeurope'

@description('Resource name prefix')
param resourcePrefix string = 'swire-copilot'

@description('Azure OpenAI model deployment name')
param openAIModelName string = 'gpt-4'

@description('Tags for all resources')
param tags object = {
  Environment: environment
  Project: 'Swire-Intelligence-Assistant'
  Compliance: 'EU-Data-Residency'
  Owner: 'Swire-IT'
}

// Variables
var resourceGroupName = '${resourcePrefix}-${environment}-rg'
var keyVaultName = '${resourcePrefix}-${environment}-kv'
var openAIServiceName = '${resourcePrefix}-${environment}-openai'
var cognitiveSearchName = '${resourcePrefix}-${environment}-search'
var storageAccountName = replace('${resourcePrefix}${environment}storage', '-', '')
var appInsightsName = '${resourcePrefix}-${environment}-insights'
var logAnalyticsName = '${resourcePrefix}-${environment}-logs'

// Key Vault for secure credential management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights for monitoring
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Storage Account for documents and data
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    defaultToOAuthAuthentication: true
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Blob containers for different document types
resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/documents'
  properties: {
    publicAccess: 'None'
  }
}

resource knowledgeBaseContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/knowledge-base'
  properties: {
    publicAccess: 'None'
  }
}

// Azure OpenAI Service (EU region for compliance)
resource openAIService 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: openAIServiceName
  location: location
  tags: tags
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: openAIServiceName
    networkAcls: {
      defaultAction: 'Deny'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Disabled'
    disableLocalAuth: true
  }
}

// GPT-4 model deployment
resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAIService
  name: openAIModelName
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4'
      version: '0613'
    }
    raiPolicyName: 'Microsoft.Default'
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// Text embedding model deployment for vector search
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAIService
  name: 'text-embedding-ada-002'
  dependsOn: [gpt4Deployment]
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-ada-002'
      version: '2'
    }
    raiPolicyName: 'Microsoft.Default'
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// Azure Cognitive Search for knowledge base
resource cognitiveSearch 'Microsoft.Search/searchServices@2023-11-01' = {
  name: cognitiveSearchName
  location: location
  tags: tags
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'disabled'
    networkRuleSet: {
      ipRules: []
    }
    encryptionWithCmk: {
      enforcement: 'Unspecified'
    }
    disableLocalAuth: true
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
  }
}

// Virtual Network for secure connectivity
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${resourcePrefix}-${environment}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '10.0.1.0/24'
          serviceEndpoints: [
            {
              service: 'Microsoft.CognitiveServices'
            }
            {
              service: 'Microsoft.Search'
            }
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
    ]
  }
}

// Private endpoints for secure access
resource openAIPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: '${openAIServiceName}-pe'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: vnet.properties.subnets[0].id
    }
    privateLinkServiceConnections: [
      {
        name: '${openAIServiceName}-pe-connection'
        properties: {
          privateLinkServiceId: openAIService.id
          groupIds: [
            'account'
          ]
        }
      }
    ]
  }
}

resource searchPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: '${cognitiveSearchName}-pe'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: vnet.properties.subnets[0].id
    }
    privateLinkServiceConnections: [
      {
        name: '${cognitiveSearchName}-pe-connection'
        properties: {
          privateLinkServiceId: cognitiveSearch.id
          groupIds: [
            'searchService'
          ]
        }
      }
    ]
  }
}

// Outputs for use in other deployments
output resourceGroupName string = resourceGroupName
output keyVaultName string = keyVault.name
output openAIServiceName string = openAIService.name
output openAIEndpoint string = openAIService.properties.endpoint
output cognitiveSearchName string = cognitiveSearch.name
output cognitiveSearchEndpoint string = 'https://${cognitiveSearch.name}.search.windows.net'
output storageAccountName string = storageAccount.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString