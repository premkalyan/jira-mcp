# Jira MCP - Project Registry Integration Review & Improvements

## Summary

Your Jira MCP **already had project registry integration working** at `api/mcp.js`! However, we found and fixed several critical issues.

## ✅ What Was Already Working

1. **Project Registry Integration** - Already implemented correctly
2. **Bearer Token Authentication** - Extracting token from Authorization header
3. **Config Lookup** - Fetching from `/api/projects?apiKey={token}` endpoint
4. **Credential Injection** - Passing Jira credentials to MCP process
5. **JSON-RPC 2.0** - Proper format handling

## 🔴 Critical Issues Fixed

### 1. Security Vulnerability - Hardcoded Token (FIXED)

**Before:**
```javascript
headers: {
  'Authorization': 'Bearer gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0='  // ❌ EXPOSED!
}
```

**After:**
```javascript
const REGISTRY_AUTH_TOKEN = process.env.REGISTRY_AUTH_TOKEN;

// Later in code:
if (REGISTRY_AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${REGISTRY_AUTH_TOKEN}`;  // ✅ SECURE!
}
```

**Action Required:** Set `REGISTRY_AUTH_TOKEN` in Vercel environment variables!

### 2. No Config Validation (FIXED)

**Before:** Would crash if Jira config was incomplete

**After:** Validates required fields (url, email, token) and returns clear error:
```javascript
const requiredFields = ['url', 'email', 'token'];
const missingFields = requiredFields.filter(field => {
  if (field === 'url' && !jiraConfig.url && !jiraConfig.host) return true;
  return !jiraConfig[field];
});

if (missingFields.length > 0) {
  return res.status(400).json({
    error: {
      message: `JIRA configuration missing required fields: ${missingFields.join(', ')}`
    }
  });
}
```

### 3. Timeout Too Long (FIXED)

**Before:** 60 seconds (exceeds Vercel's 30s limit on Hobby plan)

**After:** 25 seconds (fits within 30s limit with buffer)

```javascript
const timeout = setTimeout(() => {
  mcpProcess.kill();
  reject(new Error('Request timeout after 25 seconds'));
}, 25000);
```

### 4. Better Error Messages (IMPROVED)

Added detailed error logging:
```javascript
if (!response.ok) {
  console.error(`❌ Registry lookup failed: ${response.status} ${response.statusText}`);
  return null;
}
```

## 📝 Files Modified

1. **api/mcp.js**
   - Added `REGISTRY_AUTH_TOKEN` environment variable
   - Removed hardcoded Bearer token
   - Added Jira config validation
   - Reduced timeout to 25s
   - Improved error messages

2. **.env.example**
   - Added `REGISTRY_URL` documentation
   - Added `REGISTRY_AUTH_TOKEN` documentation

3. **vercel.json**
   - Added function configuration with 30s max duration
   - Added rewrites for proper routing

4. **PROJECT-REGISTRY-INTEGRATION.md** (NEW)
   - Complete documentation of architecture
   - Usage examples
   - Error handling guide
   - Troubleshooting section

5. **CHANGES.md** (NEW - this file)
   - Summary of all changes

## 🚀 Deployment Steps

### 1. Set Environment Variables in Vercel

```bash
# Set the registry auth token
vercel env add REGISTRY_AUTH_TOKEN
# Enter value: gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=

# Optionally override registry URL
vercel env add REGISTRY_URL
# Enter value: https://project-registry-henna.vercel.app
```

Or via Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `REGISTRY_AUTH_TOKEN` = `gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=`
3. Add `REGISTRY_URL` = `https://project-registry-henna.vercel.app`

### 2. Deploy

```bash
# Build and deploy
npm run build
vercel --prod
```

### 3. Test

```bash
# Test the endpoint
curl https://your-jira-mcp.vercel.app/api/mcp

# Should return service info with:
# - authMethod: "Authorization: Bearer {projectApiKey}"
# - registryUrl: "https://project-registry-henna.vercel.app"
```

## 🧪 Testing from VISHKAR

```bash
curl -X POST https://your-jira-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-project-api-key>" \
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

## 📊 Architecture Overview

```
VISHKAR (Bearer: project-api-key)
    ↓
Jira MCP Vercel Serverless (api/mcp.js)
    ↓ (lookup with REGISTRY_AUTH_TOKEN)
Project Registry
    ↓ (returns Jira credentials)
Jira MCP Server (dist/index.js)
    ↓
Jira Cloud API
```

## ✅ Checklist

- [x] Remove hardcoded auth token
- [x] Add environment variable for registry auth
- [x] Validate Jira config fields
- [x] Reduce timeout to fit Vercel limits
- [x] Update .env.example
- [x] Add comprehensive documentation
- [x] Configure Vercel function settings
- [ ] **Set REGISTRY_AUTH_TOKEN in Vercel** (YOU NEED TO DO THIS!)
- [ ] Deploy to Vercel
- [ ] Test with real project API key

## 🔐 Security Notes

1. **Never commit** `.env` file with real credentials
2. **Set REGISTRY_AUTH_TOKEN** in Vercel environment variables
3. **Rotate tokens** periodically
4. **Use HTTPS** for all communication
5. **Monitor logs** for unauthorized access attempts

## 📚 Additional Documentation

- `PROJECT-REGISTRY-INTEGRATION.md` - Complete integration guide
- `README.md` - General MCP server documentation
- `.env.example` - Environment variable examples

## 🆘 Troubleshooting

### "Unauthorized: Invalid API key"
- Check that the project API key is correct
- Verify the project is registered in the registry
- Ensure REGISTRY_AUTH_TOKEN is set in Vercel

### "JIRA configuration missing required fields"
- Check that your project has all required Jira config:
  - `url` or `host`
  - `email`
  - `token`

### "Request timeout after 25 seconds"
- Check if Jira API is slow
- Try simpler queries
- Check network connectivity

## 🎯 Next Steps

1. **Deploy to Vercel** with environment variables set
2. **Test** with a real project API key from VISHKAR
3. **Monitor** Vercel logs for any issues
4. **Update** VISHKAR to use this endpoint

## 🔗 Related Services

- **StoryCrafter MCP**: `/Users/premkalyan/code/Services/StoryCrafter`
- **Confluence MCP**: `/Users/premkalyan/code/mcp/confluence-mcp`
- **Project Registry**: `https://project-registry-henna.vercel.app`
