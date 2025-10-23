# JIRA MCP Implementation Guide - Quick Start

**Status**: Next.js project initialized ✅
**Next**: Implement core functionality

---

## Current State

✅ Folder created: `/Users/premkalyan/code/mcp/jira-mcp/`
✅ Next.js 14 initialized with TypeScript
✅ Migration plan documented

---

## Quick Implementation Steps

### Step 1: Update Dependencies (5 min)

```bash
cd /Users/premkalyan/code/mcp/jira-mcp
npm install --save-dev @types/node @types/react @types/react-dom
npm install axios  # For JIRA API calls
```

### Step 2: Create Environment Configuration

Create `.env.example`:
```bash
# Project Registry URL
PROJECT_REGISTRY_URL=https://project-registry-henna.vercel.app

# Optional configuration
NODE_ENV=development
```

### Step 3: Core Implementation Files Needed

#### File 1: `lib/projectRegistry.ts`
**Purpose**: Fetch credentials from Project Registry
**Key Function**: `getJiraCredentials(apiKey)`

#### File 2: `lib/jiraClient.ts`
**Purpose**: JIRA API wrapper
**Key Functions**: `searchIssues()`, `getIssue()`, `createIssue()`, etc.

#### File 3: `app/api/health/route.ts`
**Purpose**: Health check endpoint

#### File 4: `app/api/mcp/route.ts`
**Purpose**: Main MCP endpoint - handles tool requests

#### File 5: `app/api/tools/search-issues/route.ts`
**Purpose**: Search issues endpoint

### Step 4: Implement MVP Tools (Top 5)

1. **search_issues** - JQL search
2. **get_issue** - Get issue details
3. **create_issue** - Create new issue
4. **update_issue** - Update issue
5. **add_comment** - Add comment to issue

### Step 5: Deploy to Vercel

```bash
# Create GitHub repo
gh repo create jira-mcp --public --source=. --remote=origin

# Push code
git add .
git commit -m "feat: initial JIRA MCP implementation"
git push -u origin main

# Deploy to Vercel (auto-deploys from GitHub)
# Or manually:
vercel --prod
```

---

## Recommended Approach: Copy & Adapt

Since we have working JIRA MCP code in Ethios, the fastest approach:

### Option 1: Minimal Migration (Recommended - 1 hour)

1. **Copy core files from Ethios**:
   ```bash
   # Copy JIRA client
   cp /Users/premkalyan/code/Prometheus/mcp-servers/MCP-for-agents/jira-mcp-oren/src/jiraApiClient.ts \
      /Users/premkalyan/code/mcp/jira-mcp/lib/jiraClient.ts

   # Copy services
   cp -r /Users/premkalyan/code/Prometheus/mcp-servers/MCP-for-agents/jira-mcp-oren/src/services \
         /Users/premkalyan/code/mcp/jira-mcp/lib/

   # Copy utils
   cp -r /Users/premkalyan/code/Prometheus/mcp-servers/MCP-for-agents/jira-mcp-oren/src/utils \
         /Users/premkalyan/code/mcp/jira-mcp/lib/
   ```

2. **Adapt for Next.js**:
   - Remove MCP SDK dependencies
   - Convert to Next.js API routes
   - Add Project Registry integration
   - Update imports

3. **Test & Deploy**:
   - Test locally: `npm run dev`
   - Test with Project Registry
   - Deploy to Vercel

### Option 2: Simplified New Implementation (2-3 hours)

Start fresh with just the essentials:
- Basic JIRA API client
- Top 5 tools only
- Simple error handling
- Deploy and iterate

---

## Code Skeleton

### `lib/projectRegistry.ts`

```typescript
const PROJECT_REGISTRY_URL = process.env.PROJECT_REGISTRY_URL;

export async function getJiraCredentials(apiKey: string) {
  const response = await fetch(`${PROJECT_REGISTRY_URL}/api/project?apiKey=${apiKey}`);

  if (!response.ok) {
    throw new Error('Invalid API key or project not found');
  }

  const { project } = await response.json();

  if (!project.configs?.jira) {
    throw new Error('JIRA not configured for this project');
  }

  return {
    url: project.configs.jira.url,
    email: project.configs.jira.email,
    token: project.configs.jira.api_token
  };
}
```

### `lib/jiraClient.ts`

```typescript
import axios from 'axios';

export class JiraClient {
  private baseUrl: string;
  private auth: { email: string; token: string };

  constructor(config: { url: string; email: string; token: string }) {
    this.baseUrl = config.url;
    this.auth = { email: config.email, token: config.token };
  }

  private getAuthHeader() {
    const token = Buffer.from(`${this.auth.email}:${this.auth.token}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  async searchIssues(jql: string, maxResults = 50) {
    const response = await axios.get(`${this.baseUrl}/rest/api/3/search`, {
      headers: this.getAuthHeader(),
      params: { jql, maxResults }
    });
    return response.data;
  }

  async getIssue(issueKey: string) {
    const response = await axios.get(`${this.baseUrl}/rest/api/3/issue/${issueKey}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async createIssue(fields: any) {
    const response = await axios.post(
      `${this.baseUrl}/rest/api/3/issue`,
      { fields },
      { headers: { ...this.getAuthHeader(), 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async updateIssue(issueKey: string, fields: any) {
    const response = await axios.put(
      `${this.baseUrl}/rest/api/3/issue/${issueKey}`,
      { fields },
      { headers: { ...this.getAuthHeader(), 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async addComment(issueKey: string, body: string) {
    const response = await axios.post(
      `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`,
      { body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] } },
      { headers: { ...this.getAuthHeader(), 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}
```

### `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'JIRA MCP Server',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
}
```

### `app/api/mcp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getJiraCredentials } from '@/lib/projectRegistry';
import { JiraClient } from '@/lib/jiraClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const { tool, arguments: args } = await request.json();

    // Get credentials from Project Registry
    const credentials = await getJiraCredentials(apiKey);

    // Create JIRA client
    const jira = new JiraClient(credentials);

    // Execute tool
    let result;
    switch (tool) {
      case 'search_issues':
        result = await jira.searchIssues(args.jql, args.maxResults);
        break;
      case 'get_issue':
        result = await jira.getIssue(args.issueKey);
        break;
      case 'create_issue':
        result = await jira.createIssue(args.fields);
        break;
      case 'update_issue':
        result = await jira.updateIssue(args.issueKey, args.fields);
        break;
      case 'add_comment':
        result = await jira.addComment(args.issueKey, args.body);
        break;
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, tool, result });
  } catch (error: any) {
    console.error('MCP error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### `app/page.tsx` (Documentation)

```tsx
export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">JIRA MCP Server</h1>
      <p className="mb-4">Version 2.0.0 - Serverless with Project Registry Integration</p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Available Endpoints</h2>
      <ul className="list-disc pl-6">
        <li><code>/api/health</code> - Health check</li>
        <li><code>/api/mcp</code> - Main MCP endpoint</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Available Tools</h2>
      <ul className="list-disc pl-6">
        <li>search_issues - Search JIRA issues with JQL</li>
        <li>get_issue - Get issue details</li>
        <li>create_issue - Create new issue</li>
        <li>update_issue - Update existing issue</li>
        <li>add_comment - Add comment to issue</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Usage</h2>
      <pre className="bg-gray-100 p-4 rounded">
{`POST /api/mcp
Headers:
  X-API-Key: pk_your_api_key
  Content-Type: application/json

Body:
{
  "tool": "search_issues",
  "arguments": {
    "jql": "project = PROJ AND status = 'In Progress'",
    "maxResults": 50
  }
}`}
      </pre>
    </div>
  );
}
```

### `vercel.json`

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "PROJECT_REGISTRY_URL": "https://project-registry-henna.vercel.app"
  }
}
```

---

## Testing Locally

```bash
# Start dev server
npm run dev

# Test health
curl http://localhost:3002/api/health

# Test MCP call (need valid API key from Project Registry)
curl -X POST http://localhost:3002/api/mcp \
  -H "X-API-Key: pk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_issues",
    "arguments": {
      "jql": "project = PROJ",
      "maxResults": 10
    }
  }'
```

---

## Deployment

```bash
# Build
npm run build

# Deploy
vercel --prod

# Or push to GitHub for auto-deploy
git add .
git commit -m "feat: JIRA MCP v2.0"
git push origin main
```

---

## Next Steps

1. ✅ Implement core files (above)
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Test with Project Registry
5. ✅ Integrate with Vishkar
6. ⚠️ Add remaining tools (optional)

---

## Time Estimate

- **Minimal**: 1 hour (copy & adapt from Ethios)
- **From Scratch**: 2-3 hours (using skeletons above)
- **Full Migration**: 4-6 hours (all 26 tools)

**Recommendation**: Start with minimal approach, get it deployed, then iterate.

---

**Current Status**: Foundation ready, code skeletons provided
**Next Action**: Implement the code skeletons above or copy from Ethios
