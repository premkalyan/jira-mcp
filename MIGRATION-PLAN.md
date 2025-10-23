# JIRA MCP Migration Plan: Ethios → WordCell (Vercel)

**Date**: 2025-10-23
**Source**: `/Users/premkalyan/code/Prometheus/mcp-servers/MCP-for-agents/jira-mcp-oren/`
**Target**: `/Users/premkalyan/code/mcp/jira-mcp/`
**Deployment**: Vercel Serverless

---

## Architecture Changes

### Old (Ethios)
```
MCP Server (stdio/HTTP)
├── Environment Variables → Direct Credentials
├── Express.js HTTP wrapper
└── 26+ Tools via MCP SDK
```

### New (WordCell)
```
Next.js API Routes
├── API Key Header → Project Registry → Decrypted Credentials
├── Next.js Serverless Functions
└── Same 26+ Tools adapted for HTTP
```

---

## File Structure Comparison

### Old Structure
```
jira-mcp-oren/
├── src/
│   ├── index.ts                    # MCP server entry
│   ├── jiraApiClient.ts            # JIRA API wrapper
│   ├── toolRegistry.ts             # 26 MCP tools
│   ├── services/                   # Business logic
│   │   ├── boardService.ts
│   │   ├── issueService.ts
│   │   ├── userService.ts
│   │   ├── projectService.ts
│   │   └── worklogService.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── rateLimiter.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   └── types/index.ts
├── wrapper-auth.js                 # HTTP wrapper
└── package.json
```

### New Structure (Next.js)
```
jira-mcp/
├── app/
│   ├── api/
│   │   ├── health/route.ts         # Health check
│   │   ├── mcp/route.ts            # Main MCP endpoint
│   │   └── tools/                  # Individual tool endpoints
│   │       ├── search-issues/route.ts
│   │       ├── create-issue/route.ts
│   │       └── [tool]/route.ts     # Dynamic route
│   └── page.tsx                    # Documentation page
├── lib/
│   ├── jiraClient.ts               # JIRA API client
│   ├── projectRegistry.ts          # Registry integration
│   ├── tools/                      # Tool implementations
│   │   ├── boardTools.ts
│   │   ├── issueTools.ts
│   │   ├── userTools.ts
│   │   └── projectTools.ts
│   └── utils/
│       ├── logger.ts
│       ├── validation.ts
│       └── formatters.ts
├── types/
│   └── index.ts
├── package.json
└── vercel.json
```

---

## Key Changes

### 1. Authentication Flow

**Old**:
```typescript
// Direct from environment
const config = {
  url: process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  token: process.env.JIRA_API_TOKEN
};
```

**New**:
```typescript
// From Project Registry via API key
const apiKey = request.headers.get('X-API-Key');
const registryUrl = process.env.PROJECT_REGISTRY_URL;

const response = await fetch(`${registryUrl}/api/project?apiKey=${apiKey}`);
const { project } = await response.json();

const config = {
  url: project.configs.jira.url,
  email: project.configs.jira.email,
  token: project.configs.jira.api_token  // Already decrypted!
};
```

### 2. MCP Tool Invocation

**Old** (stdio/MCP SDK):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return await toolRegistry.executeTool(name, args);
});
```

**New** (HTTP endpoint):
```typescript
// POST /api/mcp
export async function POST(request: NextRequest) {
  const { tool, arguments: args } = await request.json();
  const apiKey = request.headers.get('X-API-Key');

  // Get credentials
  const credentials = await getProjectCredentials(apiKey);

  // Execute tool
  const result = await executeJiraTool(tool, args, credentials);

  return NextResponse.json(result);
}
```

### 3. HTTP Wrapper Changes

**Old** (Express wrapper):
```javascript
// wrapper-auth.js
app.post('/mcp-call', async (req, res) => {
  const { tool, arguments: args } = req.body;
  const apiKey = req.headers['x-api-key'];

  // Look up project
  const project = await registryClient.getProject(apiKey);

  // Execute MCP tool
  const result = await mcpClient.callTool(tool, args);

  res.json(result);
});
```

**New** (Next.js API Route):
```typescript
// app/api/mcp/route.ts
export async function POST(request: NextRequest) {
  const { tool, arguments: args } = await request.json();
  const apiKey = request.headers.get('X-API-Key');

  // Validate API key and get credentials
  const credentials = await getCredentials(apiKey);

  // Execute tool directly (no MCP server needed)
  const result = await jiraTools[tool](args, credentials);

  return NextResponse.json(result);
}
```

---

## Tools to Migrate (26 total)

### Board Tools (3)
- `get_boards` - List all boards
- `get_board_details` - Get board info
- `get_board_issues` - Get issues on board

### Issue Tools (7)
- `search_issues` - JQL search
- `get_issue_details` - Get issue info
- `create_issue` - Create new issue
- `update_issue` - Update existing issue
- `transition_issue` - Change status
- `add_comment` - Add comment
- `get_issue_transitions` - Get available transitions

### User Tools (3)
- `get_current_user` - Get authenticated user
- `search_users` - Find users
- `get_user_details` - Get user info

### Project Tools (2)
- `get_projects` - List projects
- `get_project_details` - Get project info

### Worklog Tools (2)
- `add_worklog` - Log work time
- `get_worklogs` - Get work logs

### Sprint Tools (5)
- `get_board_sprints` - List sprints
- `get_sprint_details` - Get sprint info
- `get_sprint_issues` - Get sprint issues
- `create_sprint` - Create sprint
- `move_issues_to_sprint` - Move issues

### Other Tools (4)
- `get_server_info` - Server status
- `get_issue_types` - List issue types
- `get_priorities` - List priorities
- `get_statuses` - List statuses

---

## Migration Steps

### Phase 1: Core Setup ✅
- [x] Create Next.js project
- [ ] Set up basic structure
- [ ] Configure TypeScript
- [ ] Add dependencies

### Phase 2: Project Registry Integration
- [ ] Create lib/projectRegistry.ts
- [ ] Implement credential fetching
- [ ] Add API key validation
- [ ] Handle decryption (done by registry)

### Phase 3: JIRA Client Migration
- [ ] Copy jiraApiClient.ts → lib/jiraClient.ts
- [ ] Adapt for Next.js environment
- [ ] Remove MCP-specific code
- [ ] Add error handling

### Phase 4: Tool Implementation
- [ ] Create lib/tools/ directory
- [ ] Migrate each tool category
- [ ] Adapt for HTTP responses
- [ ] Add input validation

### Phase 5: API Routes
- [ ] Create /api/health endpoint
- [ ] Create /api/mcp endpoint (main)
- [ ] Create /api/tools/[tool] (optional)
- [ ] Add rate limiting

### Phase 6: Testing & Deployment
- [ ] Local testing
- [ ] Build verification
- [ ] Deploy to Vercel
- [ ] Integration testing with Vishkar

---

## Simplified MVP Approach

Instead of migrating all 26 tools initially, start with top 5:

### MVP Tools
1. `search_issues` - Most used
2. `get_issue_details` - Essential
3. `create_issue` - Core functionality
4. `update_issue` - Core functionality
5. `add_comment` - Common operation

### Add Later
- Board operations
- Sprint management
- Worklog tracking
- Advanced search
- Bulk operations

---

## Environment Variables

### Vercel Environment Variables Needed
```bash
# Project Registry URL
PROJECT_REGISTRY_URL=https://project-registry-henna.vercel.app

# Optional: Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15 minutes
```

### No JIRA credentials needed!
All credentials come from Project Registry via API key.

---

## API Interface

### Request Format
```bash
POST https://jira-mcp.vercel.app/api/mcp
Headers:
  X-API-Key: pk_...
  Content-Type: application/json

Body:
{
  "tool": "search_issues",
  "arguments": {
    "jql": "project = PROJ AND status = 'In Progress'",
    "maxResults": 50
  }
}
```

### Response Format
```json
{
  "success": true,
  "tool": "search_issues",
  "result": {
    "issues": [...],
    "total": 42
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid API key",
  "details": "Project not found"
}
```

---

## Testing Strategy

### 1. Unit Tests
- Test each tool function
- Mock JIRA API responses
- Validate input/output

### 2. Integration Tests
- Test with real Project Registry
- Test credential fetching
- Test JIRA API calls

### 3. End-to-End Tests
- Test from Vishkar
- Full workflow testing
- Performance testing

---

## Deployment Checklist

- [ ] Next.js build succeeds
- [ ] All environment variables set
- [ ] Health endpoint works
- [ ] API key validation works
- [ ] Credentials fetched from registry
- [ ] JIRA API calls work
- [ ] Error handling tested
- [ ] Rate limiting works
- [ ] Logging configured
- [ ] Documentation complete

---

## Success Criteria

1. ✅ Deploys to Vercel successfully
2. ✅ Fetches credentials from Project Registry
3. ✅ Executes JIRA operations correctly
4. ✅ Returns proper JSON responses
5. ✅ Handles errors gracefully
6. ✅ Works with Vishkar integration
7. ✅ Performance acceptable (<2s response time)
8. ✅ All MVP tools functional

---

**Next**: Start with Phase 2 - Project Registry integration
