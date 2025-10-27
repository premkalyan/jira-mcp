// Vercel Serverless Function for JIRA MCP
// Accepts JSON-RPC 2.0 format with Authorization: Bearer {apiKey}

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_URL = process.env.REGISTRY_URL || 'https://project-registry-henna.vercel.app';
const REGISTRY_AUTH_TOKEN = process.env.REGISTRY_AUTH_TOKEN;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return HTML documentation page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jira MCP Server - Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 { font-size: 2.5em; margin-bottom: 10px; }
    header p { font-size: 1.2em; opacity: 0.9; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      margin: 5px;
    }
    main { padding: 40px; }
    section { margin-bottom: 40px; }
    h2 {
      color: #667eea;
      font-size: 2em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    h3 {
      color: #764ba2;
      font-size: 1.5em;
      margin: 20px 0 10px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .info-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .info-card strong { color: #667eea; display: block; margin-bottom: 5px; }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
      font-size: 0.9em;
    }
    code {
      background: #f8f9fa;
      color: #e83e8c;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    .tools-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .tool-card {
      background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #667eea44;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tool-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(102,126,234,0.3);
    }
    .tool-card strong { color: #667eea; display: block; margin-bottom: 5px; font-size: 1.1em; }
    .tool-card small { color: #666; font-size: 0.9em; }
    .endpoint {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 10px 15px;
      border-radius: 5px;
      font-weight: bold;
      display: inline-block;
      margin: 10px 0;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .success {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    footer {
      background: #2d2d2d;
      color: white;
      text-align: center;
      padding: 20px;
      font-size: 0.9em;
    }
    footer a { color: #667eea; text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Jira MCP Server</h1>
      <p>Multi-Tenant Jira Integration via Model Context Protocol</p>
      <div>
        <span class="badge">JSON-RPC 2.0</span>
        <span class="badge">Project Registry</span>
        <span class="badge">Bearer Auth</span>
        <span class="badge">v1.0.3</span>
      </div>
    </header>

    <main>
      <section>
        <h2>📋 Overview</h2>
        <p>This is a <strong>multi-tenant Jira MCP server</strong> that uses the VISHKAR Project Registry for authentication and configuration management. Each project has its own Jira credentials stored in the registry, enabling secure, isolated access to different Jira instances.</p>

        <div class="info-grid">
          <div class="info-card">
            <strong>Authentication Method</strong>
            Bearer token (Project API Key)
          </div>
          <div class="info-card">
            <strong>Registry URL</strong>
            ${REGISTRY_URL}
          </div>
          <div class="info-card">
            <strong>Format</strong>
            JSON-RPC 2.0
          </div>
          <div class="info-card">
            <strong>Endpoint</strong>
            POST /api/mcp
          </div>
        </div>
      </section>

      <section>
        <h2>🔐 How It Works</h2>
        <ol style="margin-left: 20px; line-height: 2;">
          <li><strong>VISHKAR</strong> sends a request with your project's Bearer token</li>
          <li><strong>Jira MCP</strong> looks up your project configuration in the registry</li>
          <li><strong>Registry</strong> returns your Jira credentials (URL, email, token, projectKey)</li>
          <li><strong>Jira MCP</strong> executes the request using your credentials</li>
          <li><strong>Jira API</strong> returns the response</li>
        </ol>

        <div class="success">
          <strong>✨ Key Benefit:</strong> Your Jira credentials are never hardcoded! They're fetched dynamically from the project registry based on your API key.
        </div>
      </section>

      <section>
        <h2>🛠️ Available Tools</h2>
        <p>The following Jira operations are available via the MCP server:</p>

        <h3>📊 Board Management</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>get_boards</strong>
            <small>List all Jira boards with filtering options</small>
          </div>
          <div class="tool-card">
            <strong>get_board_details</strong>
            <small>Get comprehensive board information</small>
          </div>
          <div class="tool-card">
            <strong>get_board_issues</strong>
            <small>Get issues for a specific board</small>
          </div>
        </div>

        <h3>📝 Issue Operations</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>search_issues</strong>
            <small>Search issues using JQL queries</small>
          </div>
          <div class="tool-card">
            <strong>get_issue_details</strong>
            <small>Get comprehensive issue information</small>
          </div>
          <div class="tool-card">
            <strong>create_issue</strong>
            <small>Create new issues (Epic, Story, Task, Bug)</small>
          </div>
          <div class="tool-card">
            <strong>update_issue</strong>
            <small>Update existing issue fields</small>
          </div>
          <div class="tool-card">
            <strong>transition_issue</strong>
            <small>Move issues between workflow statuses</small>
          </div>
          <div class="tool-card">
            <strong>add_comment</strong>
            <small>Add comments with rich text support</small>
          </div>
        </div>

        <h3>👥 User Management</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>get_current_user</strong>
            <small>Get authenticated user information</small>
          </div>
          <div class="tool-card">
            <strong>search_users</strong>
            <small>Find users by name, email, or username</small>
          </div>
          <div class="tool-card">
            <strong>get_user_details</strong>
            <small>Get detailed user information</small>
          </div>
        </div>

        <h3>📁 Project Operations</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>get_projects</strong>
            <small>List all accessible Jira projects</small>
          </div>
          <div class="tool-card">
            <strong>get_project_details</strong>
            <small>Get comprehensive project information</small>
          </div>
        </div>

        <h3>⏱️ Time Tracking</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>add_worklog</strong>
            <small>Log work time with flexible formats</small>
          </div>
          <div class="tool-card">
            <strong>get_worklogs</strong>
            <small>View work logs for issues</small>
          </div>
        </div>

        <h3>🖥️ System Tools</h3>
        <div class="tools-list">
          <div class="tool-card">
            <strong>get_server_info</strong>
            <small>Get Jira server status and information</small>
          </div>
        </div>
      </section>

      <section>
        <h2>📡 API Usage</h2>

        <h3>Endpoint</h3>
        <div class="endpoint">POST /api/mcp</div>

        <h3>Request Format</h3>
        <pre><code>curl -X POST https://jira-mcp.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_PROJECT_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "TOOL_NAME",
      "arguments": {
        // Tool-specific arguments
      }
    }
  }'</code></pre>

        <div class="warning">
          <strong>⚠️ Important:</strong> Replace <code>YOUR_PROJECT_API_KEY</code> with your actual project API key from the registry. The project key (e.g., <code>SA1</code>) and Jira credentials are automatically fetched from your project configuration!
        </div>

        <h3>Example 1: Get Current User</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_current_user",
    "arguments": {}
  }
}</code></pre>

        <h3>Example 2: Search Issues</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_issues",
    "arguments": {
      "jql": "assignee=currentUser() AND status!=Done",
      "maxResults": 10
    }
  }
}</code></pre>

        <p style="margin-top: 10px;"><em>Note: The <code>projectKey</code> is automatically available from your registry config, so you can use it in JQL like <code>"jql": "project = {your-project-key}"</code></em></p>

        <h3>Example 3: Create Issue</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "YOUR_PROJECT_KEY",
      "issueType": "Story",
      "summary": "Implement user authentication",
      "description": "Add JWT-based authentication system",
      "priority": "High"
    }
  }
}</code></pre>

        <p style="margin-top: 10px;"><em>The <code>projectKey</code> value comes from your project configuration in the registry (e.g., <code>"SA1"</code>). You can also retrieve it using <code>get_projects</code> tool.</em></p>

        <h3>Example 4: Update Issue</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "update_issue",
    "arguments": {
      "issueKey": "SA1-123",
      "summary": "Updated summary",
      "priority": "Critical",
      "description": "Updated description"
    }
  }
}</code></pre>

        <h3>Example 5: Link Story to Epic</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "update_issue",
    "arguments": {
      "issueKey": "SA1-63",
      "parentKey": "SA1-62"
    }
  }
}</code></pre>

        <p style="margin-top: 10px;"><em>✨ New! Use <code>parentKey</code> to link a Story to an Epic. This creates the epic-story relationship in Jira.</em></p>

        <h3>Example 6: Create Epic and Story</h3>
        <pre><code>// Step 1: Create Epic
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Epic",
      "summary": "User Authentication System",
      "description": "Complete authentication and authorization system",
      "priority": "High"
    }
  }
}

// Step 2: Create Story linked to Epic
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Story",
      "summary": "Implement JWT authentication",
      "description": "Add JWT-based token authentication",
      "priority": "High",
      "parentKey": "SA1-62"
    }
  }
}</code></pre>

        <p style="margin-top: 10px;"><em>💡 Tip: You can link stories to epics during creation using <code>parentKey</code>, or update existing stories later!</em></p>

        <h3>Example 7: Add Worklog</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "add_worklog",
    "arguments": {
      "issueKey": "SA1-123",
      "timeSpent": "2h 30m",
      "comment": "Implemented authentication logic"
    }
  }
}</code></pre>

        <h3>Example 8: Transition Issue</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "transition_issue",
    "arguments": {
      "issueKey": "SA1-123",
      "transitionName": "In Progress",
      "comment": "Starting work on this issue"
    }
  }
}</code></pre>

        <h3>Example 9: Add Comment</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "add_comment",
    "arguments": {
      "issueKey": "SA1-123",
      "comment": "Updated the implementation based on code review feedback"
    }
  }
}</code></pre>
      </section>

      <section>
        <h2>🔑 Getting Your Project API Key</h2>
        <ol style="margin-left: 20px; line-height: 2;">
          <li>Register your project in the VISHKAR Project Registry</li>
          <li>Configure your Jira credentials (URL, email, API token, project key)</li>
          <li>Copy your project API key</li>
          <li>Use it as the Bearer token in your requests</li>
        </ol>
      </section>

      <section>
        <h2>📚 Response Format</h2>
        <h3>Success Response</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Result data in markdown format..."
      }
    ]
  }
}</code></pre>

        <h3>Error Response</h3>
        <pre><code>{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Error description"
  }
}</code></pre>
      </section>

      <section>
        <h2>❌ Common Errors</h2>
        <div class="info-grid">
          <div class="info-card">
            <strong>401 Unauthorized</strong>
            Missing or invalid Bearer token
          </div>
          <div class="info-card">
            <strong>400 Bad Request</strong>
            Project has no Jira configuration
          </div>
          <div class="info-card">
            <strong>-32600 Invalid Request</strong>
            Malformed JSON-RPC 2.0 request
          </div>
          <div class="info-card">
            <strong>-32603 Internal Error</strong>
            Jira API error or MCP execution failure
          </div>
        </div>
      </section>

      <section>
        <h2>🔗 Links</h2>
        <ul style="margin-left: 20px; line-height: 2;">
          <li><a href="https://github.com/premkalyan/jira-mcp" target="_blank">GitHub Repository</a></li>
          <li><a href="https://github.com/premkalyan/jira-mcp/blob/main/PROJECT-REGISTRY-INTEGRATION.md" target="_blank">Integration Documentation</a></li>
          <li><a href="${REGISTRY_URL}" target="_blank">Project Registry</a></li>
          <li><a href="https://developer.atlassian.com/cloud/jira/platform/rest/v3/" target="_blank">Jira REST API Docs</a></li>
          <li><a href="https://modelcontextprotocol.io/" target="_blank">Model Context Protocol</a></li>
        </ul>
      </section>
    </main>

    <footer>
      <p>Jira MCP Server v1.0.3 | Built with ❤️ for VISHKAR</p>
      <p>
        <a href="https://github.com/premkalyan/jira-mcp/issues" target="_blank">Report Issues</a> |
        <a href="https://github.com/premkalyan/jira-mcp" target="_blank">View Source</a>
      </p>
    </footer>
  </div>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32600,
          message: 'Unauthorized: Missing or invalid Authorization header. Expected: Authorization: Bearer {projectApiKey}'
        }
      });
    }

    const apiKey = authHeader.replace('Bearer ', '').trim();

    // Validate JSON-RPC request
    const mcpRequest = req.body;
    if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest?.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: Expected JSON-RPC 2.0 format'
        }
      });
    }

    // Lookup project config from registry
    const projectConfig = await getProjectConfig(apiKey);
    if (!projectConfig) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Unauthorized: Invalid API key or project not found'
        }
      });
    }

    const jiraConfig = projectConfig.configs?.jira;
    if (!jiraConfig) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Bad Request: Project does not have JIRA configuration'
        }
      });
    }

    // Validate required Jira config fields
    const hasUrl = jiraConfig.url || jiraConfig.host || jiraConfig.baseUrl;
    const hasEmail = jiraConfig.email;
    const hasToken = jiraConfig.token || jiraConfig.apiToken;

    const missingFields = [];
    if (!hasUrl) missingFields.push('url/baseUrl');
    if (!hasEmail) missingFields.push('email');
    if (!hasToken) missingFields.push('token/apiToken');

    if (missingFields.length > 0) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: `Bad Request: JIRA configuration missing required fields: ${missingFields.join(', ')}`
        }
      });
    }

    console.log(`🔑 Request from project: ${projectConfig.projectName} (${projectConfig.projectId})`);

    // Normalize jiraConfig (handle both 'url', 'host', and 'baseUrl')
    const normalizedConfig = {
      ...jiraConfig,
      url: jiraConfig.url || jiraConfig.host || jiraConfig.baseUrl,
      email: jiraConfig.email,
      token: jiraConfig.token || jiraConfig.apiToken,
      projectKey: jiraConfig.projectKey || '',
      storyPointsField: jiraConfig.storyPointsField || 'customfield_10016',
      sprintField: jiraConfig.sprintField || 'customfield_10020',
      epicField: jiraConfig.epicField || 'customfield_10014'
    };

    // Execute MCP request with project-specific credentials
    const result = await executeMCPRequest(mcpRequest, normalizedConfig);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ MCP request failed:', error);

    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: `Internal Error: ${error.message || String(error)}`
      }
    });
  }
}

async function getProjectConfig(apiKey) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add Authorization header if REGISTRY_AUTH_TOKEN is configured
    if (REGISTRY_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${REGISTRY_AUTH_TOKEN}`;
    }

    const response = await fetch(`${REGISTRY_URL}/api/project?apiKey=${encodeURIComponent(apiKey)}`, {
      headers
    });

    if (!response.ok) {
      console.error(`❌ Registry lookup failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('❌ Failed to lookup project:', error);
    return null;
  }
}

async function executeMCPRequest(mcpRequest, jiraConfig) {
  return new Promise((resolve, reject) => {
    // Path to the compiled MCP server
    const mcpServerPath = path.join(__dirname, '..', 'dist', 'index.js');

    // Spawn MCP process with project-specific credentials
    const mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        JIRA_BASE_URL: jiraConfig.url || jiraConfig.host,
        JIRA_EMAIL: jiraConfig.email,
        JIRA_API_TOKEN: jiraConfig.token,
        JIRA_PROJECT_KEY: jiraConfig.projectKey || '',
        JIRA_STORY_POINTS_FIELD: jiraConfig.storyPointsField || 'customfield_10016',
        JIRA_SPRINT_FIELD: jiraConfig.sprintField || 'customfield_10020',
        JIRA_EPIC_FIELD: jiraConfig.epicField || 'customfield_10014',
        LOG_LEVEL: 'ERROR'
      }
    });

    let responseBuffer = '';
    let errorOutput = '';
    const timeout = setTimeout(() => {
      mcpProcess.kill();
      reject(new Error('Request timeout after 60 seconds'));
    }, 60000);

    mcpProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcpProcess.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        console.error('❌ MCP process failed:', errorOutput);
        return reject(new Error(`MCP process exited with code ${code}`));
      }

      // Parse the last complete JSON response
      const lines = responseBuffer.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('{')) {
          try {
            const response = JSON.parse(line);
            return resolve(response);
          } catch (e) {
            // Continue to previous line
          }
        }
      }

      reject(new Error('No valid response from MCP'));
    });

    mcpProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    // Send JSON-RPC request to MCP
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpProcess.stdin.end();
  });
}
