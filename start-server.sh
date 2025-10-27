#!/bin/bash

# Jira MCP Server Startup Script
# Loads environment variables from Prometheus .env and starts the HTTP wrapper

echo "🚀 Starting Jira MCP Server (OrenGrinker) with HTTP Wrapper..."

# Load environment variables from Prometheus .env file
if [ -f "../../.env.prometheus" ]; then
    echo "📋 Loading environment from .env.prometheus..."
    export $(grep -v '^#' ../../.env.prometheus | xargs)
    
    echo "✅ Environment loaded:"
    echo "   JIRA_URL: $JIRA_URL"
    echo "   JIRA_EMAIL: $JIRA_EMAIL"
    echo "   JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:20}..."
    echo "   JIRA_PROJECT_KEY: $JIRA_PROJECT_KEY"
else
    echo "❌ .env.prometheus file not found!"
    echo "   Please ensure .env.prometheus exists in the project root"
    exit 1
fi

# Validate required environment variables
if [ -z "$JIRA_URL" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ Missing required environment variables!"
    echo "   Required: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN"
    exit 1
fi

# Ensure built files exist
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo "🔨 Building Jira MCP server..."
    npm run build
fi

# Start the HTTP wrapper on port 8183
echo "🌐 Starting HTTP wrapper on port 8183..."
export PORT=8183
node wrapper.js
