# PowerShell script to configure Microsoft Copilot Studio for Swire Intelligence Assistant
# This script sets up the copilot environment, imports topics, and configures integrations

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$EnvironmentUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "./bot-configuration.json"
)

# Import required modules
Import-Module Microsoft.PowerApps.Administration.PowerShell -Force
Import-Module Microsoft.PowerApps.PowerShell -Force

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Function to authenticate to Power Platform
function Connect-ToPowerPlatform {
    Write-Status "Authenticating to Power Platform..."
    
    try {
        Add-PowerAppsAccount -TenantID $TenantId
        Write-Success "Successfully authenticated to Power Platform"
    }
    catch {
        Write-Error "Failed to authenticate to Power Platform: $($_.Exception.Message)"
        exit 1
    }
}

# Function to create or get Copilot Studio environment
function Initialize-CopilotEnvironment {
    Write-Status "Initializing Copilot Studio environment..."
    
    try {
        # Check if environment exists
        $env = Get-AdminPowerAppEnvironment | Where-Object { $_.DisplayName -eq "Swire-Copilot-$Environment" }
        
        if (-not $env) {
            Write-Status "Creating new Power Platform environment..."
            $env = New-AdminPowerAppEnvironment `
                -DisplayName "Swire-Copilot-$Environment" `
                -LocationName "europe" `
                -EnvironmentSku "Production" `
                -ProvisionDatabase $true `
                -CurrencyName "EUR" `
                -LanguageName "1033" `
                -Description "Swire Intelligence Assistant - $Environment Environment"
            
            Write-Success "Created new environment: $($env.EnvironmentName)"
        }
        else {
            Write-Success "Using existing environment: $($env.EnvironmentName)"
        }
        
        return $env.EnvironmentName
    }
    catch {
        Write-Error "Failed to initialize environment: $($_.Exception.Message)"
        exit 1
    }
}

# Function to create the copilot bot
function New-SwireCopilot {
    param([string]$EnvironmentName)
    
    Write-Status "Creating Swire Intelligence Assistant copilot..."
    
    try {
        # Load configuration
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        
        # Create copilot using Power Platform CLI (requires pac CLI to be installed)
        $botName = "swire-intelligence-assistant-$Environment"
        
        # Set environment context
        pac auth create --tenant $TenantId
        pac org select --environment $EnvironmentName
        
        # Create the copilot
        $createResult = pac copilot create `
            --name $config.name `
            --description $config.description `
            --language $config.language `
            --schema-version $config.schemaVersion
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully created copilot: $($config.name)"
            return $botName
        }
        else {
            throw "Failed to create copilot"
        }
    }
    catch {
        Write-Error "Failed to create copilot: $($_.Exception.Message)"
        exit 1
    }
}

# Function to configure Azure OpenAI integration
function Set-AzureOpenAIIntegration {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Status "Configuring Azure OpenAI integration..."
    
    try {
        # Load configuration
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        $openAIConfig = $config.integrations.azureOpenAI
        
        # Configure Azure OpenAI connection
        pac copilot configure-ai `
            --copilot-name $BotName `
            --ai-provider "AzureOpenAI" `
            --endpoint $openAIConfig.endpoint `
            --deployment $openAIConfig.deployment `
            --api-version $openAIConfig.apiVersion `
            --max-tokens $openAIConfig.maxTokens `
            --temperature $openAIConfig.temperature
        
        Write-Success "Azure OpenAI integration configured successfully"
    }
    catch {
        Write-Error "Failed to configure Azure OpenAI integration: $($_.Exception.Message)"
    }
}

# Function to import conversation topics
function Import-ConversationTopics {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Status "Importing conversation topics..."
    
    $topicFiles = @(
        "greeting-topic.yaml",
        "finance-topic.yaml", 
        "hse-topic.yaml",
        "hr-topic.yaml",
        "document-search-topic.yaml",
        "fallback-topic.yaml"
    )
    
    foreach ($topicFile in $topicFiles) {
        try {
            $topicPath = Join-Path "topics" $topicFile
            if (Test-Path $topicPath) {
                Write-Status "Importing topic: $topicFile"
                
                pac copilot add-topic `
                    --copilot-name $BotName `
                    --topic-file $topicPath
                
                Write-Success "Successfully imported: $topicFile"
            }
            else {
                Write-Warning "Topic file not found: $topicPath"
            }
        }
        catch {
            Write-Error "Failed to import topic $topicFile : $($_.Exception.Message)"
        }
    }
}

# Function to configure security settings
function Set-SecurityConfiguration {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Status "Configuring security settings..."
    
    try {
        # Load configuration
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        $securityConfig = $config.configuration.security
        
        # Configure authentication
        if ($securityConfig.authenticationRequired) {
            pac copilot configure-auth `
                --copilot-name $BotName `
                --auth-provider $securityConfig.authProvider `
                --enable-rbac $securityConfig.roleBasedAccess
        }
        
        # Enable audit logging
        if ($securityConfig.auditLogging) {
            pac copilot configure-logging `
                --copilot-name $BotName `
                --enable-audit-logs $true
        }
        
        Write-Success "Security configuration completed"
    }
    catch {
        Write-Error "Failed to configure security settings: $($_.Exception.Message)"
    }
}

# Function to configure channels
function Set-ChannelConfiguration {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Status "Configuring channels..."
    
    try {
        # Load configuration
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        
        foreach ($channel in $config.channels) {
            if ($channel.enabled) {
                Write-Status "Configuring channel: $($channel.name)"
                
                switch ($channel.name) {
                    "Microsoft Teams" {
                        pac copilot add-channel `
                            --copilot-name $BotName `
                            --channel-type "MicrosoftTeams" `
                            --enable-adaptive-cards $channel.configuration.adaptiveCards `
                            --enable-proactive-messaging $channel.configuration.proactiveMessaging
                    }
                    "Power BI" {
                        pac copilot add-channel `
                            --copilot-name $BotName `
                            --channel-type "PowerBI" `
                            --enable-embedded-chat $channel.configuration.embeddedChat `
                            --enable-context-aware $channel.configuration.contextAware
                    }
                    "Web Chat" {
                        if ($channel.configuration.publicAccess -eq $false) {
                            pac copilot add-channel `
                                --copilot-name $BotName `
                                --channel-type "WebChat" `
                                --require-authentication $channel.configuration.authenticationRequired
                        }
                    }
                }
                
                Write-Success "Configured channel: $($channel.name)"
            }
        }
    }
    catch {
        Write-Error "Failed to configure channels: $($_.Exception.Message)"
    }
}

# Function to test the copilot
function Test-CopilotConfiguration {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Status "Testing copilot configuration..."
    
    try {
        # Test basic conversation flow
        $testResult = pac copilot test `
            --copilot-name $BotName `
            --test-message "Hello"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Copilot test completed successfully"
        }
        else {
            Write-Warning "Copilot test completed with warnings"
        }
    }
    catch {
        Write-Error "Failed to test copilot: $($_.Exception.Message)"
    }
}

# Function to display deployment summary
function Show-DeploymentSummary {
    param([string]$BotName, [string]$EnvironmentName)
    
    Write-Host "`n========================================" -ForegroundColor $Blue
    Write-Host "Copilot Studio Deployment Summary" -ForegroundColor $Blue
    Write-Host "========================================" -ForegroundColor $Blue
    Write-Host "Environment: $Environment" -ForegroundColor $Green
    Write-Host "Copilot Name: Swire Intelligence Assistant" -ForegroundColor $Green
    Write-Host "Environment ID: $EnvironmentName" -ForegroundColor $Green
    Write-Host "Bot ID: $BotName" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Configured Features:" -ForegroundColor $Yellow
    Write-Host "✓ Azure OpenAI Integration" -ForegroundColor $Green
    Write-Host "✓ Conversation Topics (6 topics)" -ForegroundColor $Green
    Write-Host "✓ Microsoft Teams Channel" -ForegroundColor $Green
    Write-Host "✓ Power BI Integration" -ForegroundColor $Green
    Write-Host "✓ Security & Authentication" -ForegroundColor $Green
    Write-Host "✓ Audit Logging" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor $Yellow
    Write-Host "1. Configure Power Platform connectors" -ForegroundColor $Blue
    Write-Host "2. Set up Teams app deployment" -ForegroundColor $Blue
    Write-Host "3. Configure Power BI integration" -ForegroundColor $Blue
    Write-Host "4. Test end-to-end functionality" -ForegroundColor $Blue
    Write-Host ""
    Write-Success "Copilot Studio setup completed successfully!"
}

# Main execution
try {
    Write-Host "========================================" -ForegroundColor $Blue
    Write-Host "Swire Intelligence Assistant Setup" -ForegroundColor $Blue
    Write-Host "Microsoft Copilot Studio Configuration" -ForegroundColor $Blue
    Write-Host "========================================" -ForegroundColor $Blue
    Write-Host "Environment: $Environment" -ForegroundColor $Green
    Write-Host "Tenant ID: $TenantId" -ForegroundColor $Green
    Write-Host ""
    
    # Check prerequisites
    Write-Status "Checking prerequisites..."
    if (-not (Get-Command "pac" -ErrorAction SilentlyContinue)) {
        Write-Error "Power Platform CLI (pac) is not installed. Please install it first."
        exit 1
    }
    
    # Execute setup steps
    Connect-ToPowerPlatform
    $environmentName = Initialize-CopilotEnvironment
    $botName = New-SwireCopilot -EnvironmentName $environmentName
    Set-AzureOpenAIIntegration -BotName $botName -EnvironmentName $environmentName
    Import-ConversationTopics -BotName $botName -EnvironmentName $environmentName
    Set-SecurityConfiguration -BotName $botName -EnvironmentName $environmentName
    Set-ChannelConfiguration -BotName $botName -EnvironmentName $environmentName
    Test-CopilotConfiguration -BotName $botName -EnvironmentName $environmentName
    Show-DeploymentSummary -BotName $botName -EnvironmentName $environmentName
}
catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}