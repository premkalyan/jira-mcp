# JIRA MCP Vercel Deployment Guide

This JIRA MCP server accepts **JSON-RPC 2.0** format requests with **Bearer token authentication**.

## Deployment Steps

1. **Push to GitHub** (if not already):
   ```bash
   cd /Users/premkalyan/code/mcp/jira-mcp
   git init
   git add .
   git commit -m "Initial commit: Working Prometheus JIRA MCP for Vercel"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import the GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"

3. **Set Environment Variables** (in Vercel dashboard):
   ```
   REGISTRY_URL=https://project-registry-henna.vercel.app
   ```

4. **Update VISHKAR Master Config**:
   After deployment, update `~/.vishkar/master-config.json`:
   ```json
   {
     "mcpServices": {
       "jiraMCP": {
         "url": "https://your-jira-mcp.vercel.app",
         "enabled": true
       }
     }
   }
   ```

## API Format

### Request Format (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Epic",
      "summary": "Epic Title",
      "description": "Epic description",
      "priority": "High",
      "labels": ["VISHKAR", "AI-Generated"]
    }
  }
}
```

### Authentication:
```
Authorization: Bearer {projectApiKey}
```

### Response Format (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Created issue SA1-123"
      }
    ]
  }
}
```

## Testing

After deployment, test with:

```bash
curl -X POST https://your-jira-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROJECT_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_current_user",
      "arguments": {}
    }
  }'
```

## Key Differences from Previous Version

1. **API Format**: JSON-RPC 2.0 (not simple REST)
2. **Authentication**: `Authorization: Bearer` (not `X-API-Key`)
3. **Field Names**: Simple fields like `projectKey`, `issueType`, `summary` (not nested JIRA REST API format)

## Architecture

- `api/mcp.js` - Vercel serverless function that handles HTTP requests
- `src/index.ts` - MCP stdio server core (spawned per request)
- `src/jiraApiClient.ts` - JIRA REST API client
- `src/toolRegistry.ts` - Tool definitions and execution

The serverless function spawns the MCP stdio process with project-specific credentials from the Project Registry, sends the JSON-RPC request via stdin, and returns the response.
