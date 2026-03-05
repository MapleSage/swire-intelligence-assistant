#!/usr/bin/env bash
set -euo pipefail

# Update Swire Foundry agent definition (description/instructions/tools) via REST.
# Required env vars:
#   PROJECT_ENDPOINT=https://.../api/projects/<project>
#   AGENT_NAME=swire-ops-hr-agent
#   MODEL_DEPLOYMENT=swire-gpt-4o
# Optional:
#   SEARCH_CONNECTION_ID=<project_connection_id>
#   SEARCH_INDEX_NAME=swire-operations-index
#   ENABLE_WEB_TOOL=true

PROJECT_ENDPOINT="${PROJECT_ENDPOINT:-https://swirere-3699-resource.services.ai.azure.com/api/projects/swirere-3699}"
AGENT_NAME="${AGENT_NAME:-swire-ops-hr-agent}"
MODEL_DEPLOYMENT="${MODEL_DEPLOYMENT:-swire-gpt-4o}"
SEARCH_CONNECTION_ID="${SEARCH_CONNECTION_ID:-}"
SEARCH_INDEX_NAME="${SEARCH_INDEX_NAME:-swire-operations-index}"
ENABLE_WEB_TOOL="${ENABLE_WEB_TOOL:-false}"
SUBSCRIPTION_NAME="${SUBSCRIPTION_NAME:-Microsoft Azure Sponsorship}"

az account set --subscription "$SUBSCRIPTION_NAME"
TOKEN="$(az account get-access-token --resource https://ai.azure.com --query accessToken -o tsv)"

TOOLS='[]'
if [[ -n "$SEARCH_CONNECTION_ID" ]]; then
  TOOLS=$(jq -n \
    --arg conn "$SEARCH_CONNECTION_ID" \
    --arg idx "$SEARCH_INDEX_NAME" \
    '[{type:"azure_ai_search",azure_ai_search:{indexes:[{project_connection_id:$conn,index_name:$idx,query_type:"simple",top_k:5}]}}]')
fi

if [[ "$ENABLE_WEB_TOOL" == "true" ]]; then
  TOOLS=$(jq -n --argjson t "$TOOLS" '$t + [{type:"bing_grounding"}]')
fi

PAYLOAD=$(jq -n \
  --arg name "$AGENT_NAME" \
  --arg model "$MODEL_DEPLOYMENT" \
  --argjson tools "$TOOLS" \
  '{
    definition:{
      kind:"prompt",
      model:$model,
      instructions:"You are Swire Operations and HR assistant.\n\nPrimary mode: employees read department manuals directly from the portal.\nYour role: follow-up help, policy clarification, and cross-department search.\n\nRules:\n1) Ground answers in indexed Swire policy/manual content first.\n2) State when a response is based on indexed docs vs general guidance.\n3) If content is missing, recommend uploading the source document to the relevant department page.\n4) Keep answers concise, action-oriented, and operational.\n5) For HR/policy queries, include compliance caveats when required.",
      tools:$tools
    }
  }')

curl -sS -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "${PROJECT_ENDPOINT}/agents/${AGENT_NAME}?api-version=v1" \
  -d "$PAYLOAD" | jq '{id,name,latest_version:.versions.latest.version,model:.versions.latest.definition.model,tool_count:(.versions.latest.definition.tools|length)}'

echo "Agent updated: $AGENT_NAME"
