// Jira MCP HTTP Wrapper
// Provides HTTP interface to OrenGrinker Jira MCP (stdio)
// Based on GitHub Official MCP wrapper pattern

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JiraMCPWrapper {
  constructor() {
    this.app = express();
    this.mcpProcess = null;
    this.isReady = false;
    this.requestQueue = [];
    this.responseBuffer = ''; // Buffer for large responses
    
    this.setupRoutes();
    this.initializeMCP();
  }

  setupRoutes() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        mcpReady: this.isReady,
        service: 'Jira MCP Wrapper (OrenGrinker)',
        capabilities: [
          'Board Management', 
          'Issue Operations', 
          'User Management', 
          'Project Administration',
          'Time Tracking',
          'Comment System',
          'Server Information'
        ],
        tools: [
          'get_boards', 'get_board_details', 'get_board_issues',
          'search_issues', 'get_issue_details', 'create_issue', 'update_issue', 'transition_issue', 'add_comment',
          'get_current_user', 'search_users', 'get_user_details',
          'get_projects', 'get_project_details',
          'add_worklog', 'get_worklogs',
          'get_server_info'
        ]
      });
    });

    // Main MCP endpoint - forwards requests to stdio MCP
    this.app.post('/mcp', async (req, res) => {
      if (!this.isReady) {
        return res.status(503).json({
          error: 'Jira MCP not ready',
          message: 'MCP server is initializing'
        });
      }

      try {
        const response = await this.forwardToMCP(req.body);
        res.json(response);
      } catch (error) {
        console.error('❌ Jira MCP request failed:', error);
        res.status(500).json({
          error: 'Jira MCP request failed',
          message: error.message
        });
      }
    });

    // Info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        name: 'Jira MCP Wrapper (OrenGrinker)',
        version: '1.0.0',
        description: 'HTTP wrapper for OrenGrinker Jira MCP Server - Production-ready, feature-rich Jira Cloud integration',
        github: 'https://github.com/OrenGrinker/jira-mcp-server',
        features: {
          'Board Management': 'List, filter, and manage Jira boards with detailed information',
          'Issue Operations': 'Create, update, search, transition, and manage issues comprehensively',
          'User Management': 'Search users, get user details, and manage assignments',
          'Project Administration': 'View projects, get detailed project information',
          'Time Tracking': 'Add and view work logs with flexible time formats',
          'Comment System': 'Add comments with rich text support (ADF format)',
          'Server Information': 'Monitor server status and health'
        },
        endpoints: {
          '/health': 'Health check and capability overview',
          '/mcp': 'MCP JSON-RPC endpoint',
          '/info': 'Service information and features'
        }
      });
    });
  }

  async initializeMCP() {
    console.log('🚀 Initializing Jira MCP Server (OrenGrinker)...');
    
    // Map environment variables from Prometheus .env format to Jira MCP format
    const jiraUrl = process.env.JIRA_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;
    
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      console.error('❌ Missing required Jira configuration:');
      console.error(`   JIRA_URL: ${jiraUrl ? '✓' : '✗'}`);
      console.error(`   JIRA_EMAIL: ${jiraEmail ? '✓' : '✗'}`);  
      console.error(`   JIRA_API_TOKEN: ${jiraToken ? '✓' : '✗'}`);
      process.exit(1);
    }

    console.log(`🔗 Connecting to Jira: ${jiraUrl}`);
    console.log(`👤 Using email: ${jiraEmail}`);
    console.log(`🔑 Using API token (length: ${jiraToken.length})`);
    
    try {
      // Get the path to the built Jira MCP server
      const mcpServerPath = path.join(__dirname, 'dist', 'index.js');
      
      // Spawn Jira MCP in stdio mode
      this.mcpProcess = spawn('node', [mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Map Prometheus env vars to Jira MCP expected format
          JIRA_BASE_URL: jiraUrl,
          JIRA_EMAIL: jiraEmail,
          JIRA_API_TOKEN: jiraToken,
          LOG_LEVEL: process.env.LOG_LEVEL || 'INFO'
        }
      });

      this.mcpProcess.stdout.on('data', (data) => {
        this.responseBuffer += data.toString();
        
        // Process complete lines (responses)
        const lines = this.responseBuffer.split('\n');
        this.responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        lines.forEach(line => {
          if (line.trim()) {
            this.handleMCPResponse(line.trim());
          }
        });
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.log('📛 Jira MCP stderr:', data.toString());
      });

      this.mcpProcess.on('close', (code) => {
        console.log(`📛 Jira MCP process exited with code ${code}`);
        this.isReady = false;
        // Restart after 5 seconds
        setTimeout(() => this.initializeMCP(), 5000);
      });

      this.mcpProcess.on('error', (error) => {
        console.error('❌ Failed to start Jira MCP:', error);
        this.isReady = false;
      });

      // Wait for initialization
      setTimeout(() => {
        this.isReady = true;
        console.log('✅ Jira MCP ready');
        console.log('🛠️  Available tools: Board Management, Issue Operations, User Management, Project Admin, Time Tracking, Comments, Server Info');
        this.processRequestQueue();
      }, 3000);

    } catch (error) {
      console.error('❌ Jira MCP initialization failed:', error);
      process.exit(1);
    }
  }

  async forwardToMCP(request) {
    return new Promise((resolve, reject) => {
      const requestId = request.id || Date.now();
      const timeout = 120000; // 2 minutes for large Jira API responses

      // Add to queue
      this.requestQueue.push({ id: requestId, resolve, reject });

      // Send to MCP
      try {
        this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        reject(error);
        return;
      }

      // Timeout handling
      setTimeout(() => {
        const queueIndex = this.requestQueue.findIndex(req => req.id === requestId);
        if (queueIndex !== -1) {
          this.requestQueue.splice(queueIndex, 1);
          reject(new Error('Request timeout after 2 minutes'));
        }
      }, timeout);
    });
  }

  handleMCPResponse(responseText) {
    try {
      // Skip non-JSON responses (logs, messages)
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        // This is likely a log message, ignore it
        return;
      }

      const response = JSON.parse(trimmed);
      const requestId = response.id;

      const queueIndex = this.requestQueue.findIndex(req => req.id === requestId);
      if (queueIndex !== -1) {
        const request = this.requestQueue[queueIndex];
        this.requestQueue.splice(queueIndex, 1);
        request.resolve(response);
      }
    } catch (error) {
      // Only log JSON parsing errors for what looks like JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        console.error('❌ Failed to parse Jira MCP response:', error.message);
        console.error('📋 Response text:', responseText.substring(0, 200));
      }
      // Ignore non-JSON responses silently
    }
  }

  processRequestQueue() {
    // Process any queued requests after initialization
    console.log(`🔄 Processing ${this.requestQueue.length} queued requests`);
  }

  start() {
    const port = process.env.PORT || 8183;
    this.app.listen(port, () => {
      console.log(`🌐 Jira MCP Wrapper listening on port ${port}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
      console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
      console.log(`ℹ️  Service info: http://localhost:${port}/info`);
    });
  }
}

// Start the service
const wrapper = new JiraMCPWrapper();
wrapper.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  if (wrapper.mcpProcess) {
    wrapper.mcpProcess.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  if (wrapper.mcpProcess) {
    wrapper.mcpProcess.kill();
  }
  process.exit(0);
});
