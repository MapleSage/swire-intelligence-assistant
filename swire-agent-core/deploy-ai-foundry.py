import os
from azure.ai.ml import MLClient
from azure.ai.ml.entities import ManagedOnlineEndpoint, ManagedOnlineDeployment, Model, Environment, CodeConfiguration
from azure.identity import DefaultAzureCredential

# Azure ML configuration
subscription_id = "your-subscription-id"
resource_group = "ai-parvinddutta9607ai577068173144"
workspace_name = "ai-parvinddutta9607ai577068173144"

# Initialize ML Client
credential = DefaultAzureCredential()
ml_client = MLClient(credential, subscription_id, resource_group, workspace_name)

# Create endpoint
endpoint = ManagedOnlineEndpoint(
    name="swire-intelligence-endpoint",
    description="Swire Intelligence Assistant FastAPI",
    auth_mode="key"
)

# Create the endpoint
ml_client.online_endpoints.begin_create_or_update(endpoint).result()

# Create model
model = Model(
    path=".",
    name="swire-agent-model",
    description="Swire Intelligence Agent"
)

# Register the model
registered_model = ml_client.models.create_or_update(model)

# Create environment
environment = Environment(
    name="swire-fastapi-env",
    description="FastAPI environment for Swire Intelligence",
    image="mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest",
    conda_file="environment.yml"
)

# Create deployment
deployment = ManagedOnlineDeployment(
    name="swire-deployment",
    endpoint_name="swire-intelligence-endpoint",
    model=registered_model,
    environment=environment,
    code_configuration=CodeConfiguration(
        code=".",
        scoring_script="score.py"
    ),
    instance_type="Standard_DS3_v2",
    instance_count=1
)

# Deploy
ml_client.online_deployments.begin_create_or_update(deployment).result()

# Set traffic
endpoint.traffic = {"swire-deployment": 100}
ml_client.online_endpoints.begin_create_or_update(endpoint).result()

print("✅ Deployed to Azure AI Foundry!")
print("🌐 Endpoint URL available in Azure ML Studio")