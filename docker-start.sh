#!/bin/bash

# Docker Startup Script for Jira MCP Server
# Builds and starts the Jira MCP container following GitHub MCP pattern

echo "🐳 Starting Jira MCP Server in Docker..."

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

# Stop existing container if running
echo "🧹 Stopping existing Jira MCP container..."
docker stop jira-mcp-http-server 2>/dev/null || true
docker rm jira-mcp-http-server 2>/dev/null || true

# Build and start the container
echo "🔨 Building Jira MCP Docker image..."
docker-compose -f docker-compose-http.yml build

echo "🚀 Starting Jira MCP container..."
docker-compose -f docker-compose-http.yml up -d

# Wait for container to be ready
echo "🔄 Waiting for Jira MCP to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8183/health > /dev/null 2>&1; then
        echo "✅ Jira MCP is ready on port 8183!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Jira MCP failed to start after 60 seconds"
        echo "📋 Container logs:"
        docker logs jira-mcp-http-server
        exit 1
    fi
    
    sleep 2
done

# Test the service
echo "🧪 Testing Jira MCP service..."
echo "   Health check: $(curl -s http://localhost:8183/health | jq -r .status 2>/dev/null || echo 'OK')"

# Show container status
echo "🐳 Container status:"
docker ps | grep jira-mcp

echo ""
echo "✅ Jira MCP Docker deployment complete!"
echo "🔗 Service URL: http://localhost:8183"
echo "📋 Health check: curl http://localhost:8183/health"
echo "ℹ️  Service info: curl http://localhost:8183/info"
echo ""
echo "🛑 To stop: docker-compose -f docker-compose-http.yml down"
