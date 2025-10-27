# Jira MCP - Project Registry Integration

This document explains how the Jira MCP integrates with the VISHKAR Project Registry for multi-tenant authentication and configuration management.

## Overview

The Jira MCP uses a **project registry pattern** where:
1. **Vishkar** sends requests with a **Bearer token** (API key)
2. The **Jira MCP** looks up the project configuration using that token
3. The **Project Registry** returns Jira credentials for that specific project
4. The **Jira MCP** executes the request using those credentials

This enables **multi-tenant support** where different projects can use the same Jira MCP deployment with their own Jira instances and credentials.

## Architecture Flow

```
┌─────────────┐
│   VISHKAR   │
└──────┬──────┘
       │ 1. POST /api/mcp
       │    Authorization: Bearer <project-api-key>
       │    JSON-RPC 2.0 request
       ▼
┌─────────────────────┐
│  Vercel Serverless  │
│   (api/mcp.js)      │
└──────┬──────────────┘
       │ 2. Lookup config
       │    GET /api/projects?apiKey=<project-api-key>
       ▼
┌──────────────────────┐
│  Project Registry    │
│  (Vercel)            │
└──────┬───────────────┘
       │ 3. Return project config with Jira credentials
       ▼
┌─────────────────────┐
│  Jira MCP Server    │
│  (dist/index.js)    │
└──────┬──────────────┘
       │ 4. Execute Jira API call
       ▼
┌──────────────────────┐
│  Jira Cloud          │
└──────────────────────┘
```

## Configuration

### Environment Variables

Add these to your Vercel deployment environment:

```bash
# Project Registry Configuration
REGISTRY_URL=https://project-registry-henna.vercel.app
REGISTRY_AUTH_TOKEN=your-registry-bearer-token
```

### Project Registry Format

The Project Registry at `https://project-registry-henna.vercel.app` expects:

**Request:**
```
GET /api/projects?apiKey={project-api-key}
Authorization: Bearer {REGISTRY_AUTH_TOKEN}
```

**Response:**
```json
{
  "project": {
    "projectId": "proj-123",
    "projectName": "My Project",
    "configs": {
      "jira": {
        "url": "https://company.atlassian.net",
        "email": "jira-user@company.com",
        "token": "jira-api-token",
        "projectKey": "PROJ",
        "storyPointsField": "customfield_10016",
        "sprintField": "customfield_10020",
        "epicField": "customfield_10014"
      }
    }
  }
}
```

### Required Jira Configuration Fields

The following fields are **required** in the `configs.jira` object:
- `url` or `host` - Jira base URL (e.g., `https://company.atlassian.net`)
- `email` - Jira user email
- `token` - Jira API token

Optional fields:
- `projectKey` - Default project key
- `storyPointsField` - Custom field ID for story points (default: `customfield_10016`)
- `sprintField` - Custom field ID for sprints (default: `customfield_10020`)
- `epicField` - Custom field ID for epic link (default: `customfield_10014`)

## Usage from VISHKAR

### 1. Register Your Project

Register your project in the Project Registry with Jira credentials.

### 2. Get Your API Key

The Project Registry will provide you with an API key (Bearer token).

### 3. Make Requests

Send JSON-RPC 2.0 requests to the Jira MCP:

```bash
curl -X POST https://jira-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-project-api-key>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_issues",
      "arguments": {
        "jql": "assignee=currentUser() AND status!=Done"
      }
    }
  }'
```

## API Endpoint

### POST /api/mcp

**Authentication:** Bearer token (project API key)

**Request Format:** JSON-RPC 2.0

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {project-api-key}
```

**Request Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "arg1": "value1"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool result..."
      }
    ]
  }
}
```

### GET /api/mcp

Returns service information and endpoint documentation.

## Error Handling

### 401 Unauthorized

**Cause:** Missing or invalid Bearer token

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Unauthorized: Missing or invalid Authorization header"
  }
}
```

### 400 Bad Request - No Jira Config

**Cause:** Project doesn't have Jira configuration

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Bad Request: Project does not have JIRA configuration"
  }
}
```

### 400 Bad Request - Missing Fields

**Cause:** Jira configuration is incomplete

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Bad Request: JIRA configuration missing required fields: url, token"
  }
}
```

## Security Features

1. **No credential storage** - Credentials are fetched dynamically per request
2. **Bearer token authentication** - Secure API key-based authentication
3. **Environment variable for registry token** - Registry auth token not hardcoded
4. **Validation** - All config fields validated before use
5. **Short-lived processes** - MCP process spawned per request and terminated

## Performance Considerations

- **Timeout:** 25 seconds (fits within Vercel's 30s limit)
- **Process spawning:** Each request spawns a new Node.js process running the MCP server
- **Cold starts:** First request may be slower due to Vercel cold start

## Troubleshooting

### Request Timeout

If requests are timing out:
1. Check if Jira API is responsive
2. Simplify JQL queries
3. Reduce the amount of data being fetched

### Invalid API Key

If getting 401 errors:
1. Verify your project API key is correct
2. Check that the project is registered in the Project Registry
3. Ensure the Project Registry is accessible

### Missing Jira Config

If getting "Project does not have JIRA configuration":
1. Verify your project has `configs.jira` in the registry
2. Check that all required fields are present
3. Ensure the registry is returning the correct format

## Deployment

### Vercel Deployment

1. Deploy the Jira MCP to Vercel
2. Set environment variables:
   ```bash
   vercel env add REGISTRY_URL
   vercel env add REGISTRY_AUTH_TOKEN
   ```
3. Deploy:
   ```bash
   npm run build
   vercel --prod
   ```

### Testing

Test the endpoint:
```bash
curl https://your-jira-mcp.vercel.app/api/mcp
```

Should return service information.

## Reference Implementations

Similar implementations:
- **StoryCrafter MCP** - Python-based FastAPI service with project registry
- **Confluence MCP** - TypeScript-based with project registry pattern

## Support

For issues or questions:
- GitHub Issues: https://github.com/premkalyan/jira-mcp/issues
- Check the Project Registry documentation
- Review Vercel deployment logs

## Version History

- **v1.0.3** - Added project registry integration with security improvements
- **v1.0.0** - Initial MCP server implementation
