# JIRA MCP Deployment Guide

**Date**: 2025-10-23
**Status**: Code complete, ready for Vercel deployment
**GitHub**: https://github.com/premkalyan/jira-mcp

---

## Quick Deployment to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import GitHub Repository**
   - Select "Import Git Repository"
   - Choose: `premkalyan/jira-mcp`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Environment Variables**
   Add the following in Vercel:
   ```
   PROJECT_REGISTRY_URL=https://project-registry-henna.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - Get your deployment URL (e.g., `https://jira-mcp.vercel.app`)

### Option 2: Vercel CLI (If token is fixed)

```bash
cd /Users/premkalyan/code/mcp/jira-mcp
npx vercel --prod --yes
```

---

## Post-Deployment Testing

### 1. Test Health Endpoint

```bash
curl https://jira-mcp.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "JIRA MCP Server",
  "version": "2.0.0",
  "timestamp": "2025-10-23T..."
}
```

### 2. Test MCP Endpoint (GET)

```bash
curl https://jira-mcp.vercel.app/api/mcp
```

Expected response:
```json
{
  "service": "JIRA MCP Server",
  "version": "2.0.0",
  "availableTools": [
    "search_issues",
    "get_issue",
    "create_issue",
    "update_issue",
    "add_comment",
    "transition_issue",
    "get_issue_transitions"
  ],
  "usage": "POST to this endpoint with tool name and arguments"
}
```

### 3. Test with Project Registry Integration

You'll need a valid API key from the Project Registry. Test with:

```bash
curl -X POST https://jira-mcp.vercel.app/api/mcp \
  -H 'X-API-Key: pk_YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "search_issues",
    "arguments": {
      "jql": "project = PROJ",
      "maxResults": 10
    }
  }'
```

---

## Environment Variables

### Required

- **`PROJECT_REGISTRY_URL`**: URL of the Project Registry
  - Value: `https://project-registry-henna.vercel.app`
  - Where to set: Vercel Dashboard → Settings → Environment Variables

### Optional

- None currently

---

## Integration with Vishkar

### 1. Register JIRA Credentials in Project Registry

First, register your JIRA credentials in the Project Registry:

```bash
curl -X POST https://project-registry-henna.vercel.app/api/projects/register \
  -H 'Content-Type: application/json' \
  -d '{
    "projectName": "Vishkar-JIRA",
    "configs": {
      "jira": {
        "url": "https://your-domain.atlassian.net",
        "email": "your-email@domain.com",
        "api_token": "your-jira-api-token"
      }
    }
  }'
```

Save the returned `apiKey` (starts with `pk_`).

### 2. Configure Vishkar

Update Vishkar configuration to use the JIRA MCP endpoint:

```yaml
jira_mcp:
  url: https://jira-mcp.vercel.app/api/mcp
  api_key: pk_YOUR_API_KEY_FROM_STEP_1
  timeout: 30000
```

### 3. Test from Vishkar

Use Vishkar to make a test call:

```javascript
// In Vishkar
const response = await jiraMcpClient.searchIssues({
  jql: "project = PROJ AND status = 'In Progress'",
  maxResults: 50
});
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Invalid or missing API key

**Solution**:
1. Verify API key is registered in Project Registry
2. Check API key format (should start with `pk_`)
3. Test API key: `curl https://project-registry-henna.vercel.app/api/project?apiKey=pk_YOUR_KEY`

### Issue: 500 Internal Server Error

**Cause**: JIRA credentials not found or invalid

**Solution**:
1. Check if JIRA is configured in Project Registry:
   ```bash
   curl https://project-registry-henna.vercel.app/api/project?apiKey=pk_YOUR_KEY
   ```
2. Verify JIRA credentials are correct
3. Check Vercel logs for detailed error

### Issue: PROJECT_REGISTRY_URL not configured

**Cause**: Environment variable not set in Vercel

**Solution**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `PROJECT_REGISTRY_URL` with value `https://project-registry-henna.vercel.app`
3. Redeploy the project

---

## Architecture

```
┌──────────┐
│ Vishkar  │
└────┬─────┘
     │ X-API-Key: pk_xxx
     ▼
┌──────────────────────────┐
│ JIRA MCP (Vercel)        │
│ https://jira-mcp.vercel.app
└────┬─────────────────────┘
     │ Fetch credentials
     ▼
┌──────────────────────────┐
│ Project Registry         │
│ Returns decrypted creds  │
└────┬─────────────────────┘
     │ Use JIRA credentials
     ▼
┌──────────────────────────┐
│ JIRA Cloud API           │
│ Execute operations       │
└──────────────────────────┘
```

---

## Available Tools

### 1. search_issues
Search JIRA issues using JQL

**Arguments**:
- `jql` (string): JQL query
- `maxResults` (number): Max results to return (default: 50)

**Example**:
```json
{
  "tool": "search_issues",
  "arguments": {
    "jql": "project = PROJ AND status = 'In Progress'",
    "maxResults": 50
  }
}
```

### 2. get_issue
Get details of a specific issue

**Arguments**:
- `issueKey` (string): Issue key (e.g., "PROJ-123")

**Example**:
```json
{
  "tool": "get_issue",
  "arguments": {
    "issueKey": "PROJ-123"
  }
}
```

### 3. create_issue
Create a new JIRA issue

**Arguments**:
- `fields` (object): Issue fields

**Example**:
```json
{
  "tool": "create_issue",
  "arguments": {
    "fields": {
      "project": { "key": "PROJ" },
      "summary": "New issue summary",
      "description": "Issue description",
      "issuetype": { "name": "Task" }
    }
  }
}
```

### 4. update_issue
Update an existing issue

**Arguments**:
- `issueKey` (string): Issue key
- `fields` (object): Fields to update

**Example**:
```json
{
  "tool": "update_issue",
  "arguments": {
    "issueKey": "PROJ-123",
    "fields": {
      "summary": "Updated summary",
      "description": "Updated description"
    }
  }
}
```

### 5. add_comment
Add a comment to an issue

**Arguments**:
- `issueKey` (string): Issue key
- `body` (string): Comment text

**Example**:
```json
{
  "tool": "add_comment",
  "arguments": {
    "issueKey": "PROJ-123",
    "body": "This is a comment"
  }
}
```

### 6. transition_issue
Change issue status/workflow state

**Arguments**:
- `issueKey` (string): Issue key
- `transitionId` (string): Transition ID

**Example**:
```json
{
  "tool": "transition_issue",
  "arguments": {
    "issueKey": "PROJ-123",
    "transitionId": "21"
  }
}
```

### 7. get_issue_transitions
Get available transitions for an issue

**Arguments**:
- `issueKey` (string): Issue key

**Example**:
```json
{
  "tool": "get_issue_transitions",
  "arguments": {
    "issueKey": "PROJ-123"
  }
}
```

---

## Success Criteria

- [ ] Deployed to Vercel successfully
- [ ] Health endpoint returns 200
- [ ] MCP endpoint GET returns tool list
- [ ] Can fetch credentials from Project Registry
- [ ] Can execute JIRA operations with valid API key
- [ ] Error responses are properly formatted
- [ ] Logs show proper request/response flow
- [ ] Integration with Vishkar works end-to-end

---

## Next Steps

1. **Deploy to Vercel** (use dashboard method above)
2. **Test endpoints** (health, MCP GET)
3. **Register test project** in Project Registry
4. **Test MCP POST** with real JIRA credentials
5. **Integrate with Vishkar**
6. **Monitor logs** for any issues
7. **Add more tools** as needed (optional)

---

**Last Updated**: 2025-10-23
**Status**: Ready for deployment
**Estimated Deployment Time**: 5-10 minutes
