# Jira MCP - Deployment Quick Start

## 🚀 Quick Deployment (5 minutes)

### Step 1: Set Environment Variables

```bash
cd /Users/premkalyan/code/mcp/jira-mcp

# Option A: Using Vercel CLI
vercel env add REGISTRY_AUTH_TOKEN
# When prompted, enter: gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=

vercel env add REGISTRY_URL
# When prompted, enter: https://project-registry-henna.vercel.app
```

Or use Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add both variables for all environments (Production, Preview, Development)

### Step 2: Deploy

```bash
# Build the project
npm run build

# Deploy to production
vercel --prod
```

### Step 3: Test

```bash
# Get your deployment URL (e.g., https://jira-mcp.vercel.app)
# View the homepage
curl https://your-jira-mcp.vercel.app/api/mcp

# Test the API
curl -X POST https://your-jira-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ" \
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

## ✅ Environment Variables Required

| Variable | Value | Purpose |
|----------|-------|---------|
| `REGISTRY_URL` | `https://project-registry-henna.vercel.app` | Project registry endpoint |
| `REGISTRY_AUTH_TOKEN` | `gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=` | Auth token for registry access |

## 📋 Pre-Deployment Checklist

- [x] Code changes committed
- [x] Environment variables documented
- [x] Test suite passing
- [ ] REGISTRY_AUTH_TOKEN set in Vercel
- [ ] REGISTRY_URL set in Vercel
- [ ] Deployed to production
- [ ] Tested with real bearer token

## 🔗 URLs

- **Homepage**: `https://your-deployment.vercel.app/api/mcp` (GET)
- **API Endpoint**: `https://your-deployment.vercel.app/api/mcp` (POST)
- **Project Registry**: `https://project-registry-henna.vercel.app`
- **GitHub**: `https://github.com/premkalyan/jira-mcp`

## 🧪 Test Commands

### Local Testing
```bash
node test-mcp-api.js
```

### Production Testing
```bash
# Test homepage
curl https://your-deployment.vercel.app/api/mcp

# Test auth (should fail)
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_current_user","arguments":{}}}'

# Test with valid token
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_current_user","arguments":{}}}'
```

## 📊 Available Tools (16)

Quick reference of all available MCP tools:

**Board Management**
- `get_boards`
- `get_board_details`
- `get_board_issues`

**Issue Operations**
- `search_issues`
- `get_issue_details`
- `create_issue`
- `update_issue`
- `transition_issue`
- `add_comment`

**User Management**
- `get_current_user`
- `search_users`
- `get_user_details`

**Project Operations**
- `get_projects`
- `get_project_details`

**Time Tracking**
- `add_worklog`
- `get_worklogs`

**System**
- `get_server_info`

## 🔧 Vercel Configuration

Your `vercel.json`:
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "functions": {
    "api/mcp.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/mcp",
      "destination": "/api/mcp.js"
    }
  ]
}
```

## 📝 Usage from VISHKAR

```typescript
// Example VISHKAR integration
const response = await fetch('https://jira-mcp.vercel.app/api/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${projectApiKey}`
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_issues',
      arguments: {
        jql: 'assignee=currentUser() AND status!=Done',
        maxResults: 10
      }
    }
  })
});

const result = await response.json();
```

## ⚠️ Important Notes

1. **Project Key**: Comes from registry, not hardcoded!
2. **Timeout**: Set to 60 seconds (Vercel max is 30s for serverless functions on Hobby plan)
3. **Bearer Token**: Each project has unique token from registry
4. **Config Fields**: Supports both `baseUrl` and `url`, `apiToken` and `token`

## 🆘 Quick Troubleshooting

**Error: 401 Unauthorized**
→ Check Bearer token is correct and project is registered

**Error: Project does not have JIRA configuration**
→ Verify project has `configs.jira` with all required fields in registry

**Error: Request timeout**
→ Check Jira API is accessible and query is not too complex

**Error: REGISTRY_AUTH_TOKEN not set**
→ Add environment variable in Vercel dashboard

## 📚 Documentation

- Full guide: `PROJECT-REGISTRY-INTEGRATION.md`
- Changes: `CHANGES.md`
- Summary: `FINAL-SUMMARY.md`
- This guide: `DEPLOYMENT-QUICKSTART.md`

## 🎊 You're Done!

Once deployed, share your URL with the team:
- **Homepage**: https://your-deployment.vercel.app/api/mcp
- **API**: Same URL, POST with Bearer token

Happy integrating! 🚀
