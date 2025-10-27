// Jira MCP HTTP Wrapper with Project Registry Authentication
// Supports Authorization: Bearer {apiKey} header
// Looks up project config and spawns MCP per-request or uses pool

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:8180';

// Enhanced error responses with helpful documentation
const ERROR_HELP = {
  createIssue400: {
    error: 'JIRA API returned 400 Bad Request',
    possibleCauses: [
      'Invalid issue type (must be exact case: "Epic", "Story", "Task", "Bug", "Sub-task")',
      'Missing required field: "summary" is required',
      'Invalid priority (must be: "Highest", "High", "Medium", "Low", "Lowest")',
      'Invalid field names (use "issueType" not "type", "summary" not "title")'
    ],
    correctFormat: {
      projectKey: 'SA1',
      issueType: 'Epic',
      summary: 'Epic or Story title',
      description: 'Optional description with details',
      priority: 'High',
      labels: ['tag1', 'tag2']
    },
    requiredFields: ['issueType', 'summary'],
    documentation: 'See VISHKAR-JIRA-EPIC-STORY-FORMAT.md for complete guide',
    examples: {
      epic: 'POST /mcp with {"name":"create_issue","arguments":{"issueType":"Epic","summary":"Epic Title"}}',
      story: 'POST /mcp with {"name":"create_issue","arguments":{"issueType":"Story","summary":"Story Title"}}'
    }
  },
  validation: {
    error: 'Field validation failed',
    validIssueTypes: ['Epic', 'Story', 'Task', 'Bug', 'Sub-task'],
    validPriorities: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    requiredFields: {
      create_issue: ['issueType', 'summary'],
      update_issue: ['issueKey'],
      transition_issue: ['issueKey', 'transitionName']
    }
  }
};

class JiraMCPWrapperAuth {
  constructor() {
    this.app = express();
    this.mcpServerPath = path.join(__dirname, 'dist', 'index.js');

    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Jira MCP Wrapper (Auth-enabled)',
        authMethod: 'Authorization: Bearer {projectApiKey}',
        registryUrl: REGISTRY_URL
      });
    });

    // How-to endpoint - provides usage documentation
    this.app.get('/howto', (req, res) => {
      res.json({
        service: 'JIRA MCP with Authentication',
        version: '1.0.0',
        authentication: {
          method: 'Bearer Token',
          header: 'Authorization: Bearer {projectApiKey}',
          howToGetKey: 'Register your project at http://localhost:8180/api/projects/register'
        },
        endpoint: {
          url: 'POST http://localhost:8171/mcp',
          contentType: 'application/json',
          format: 'JSON-RPC 2.0'
        },
        commonOperations: {
          createEpic: {
            description: 'Create a JIRA Epic',
            example: {
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'create_issue',
                arguments: {
                  projectKey: 'SA1',
                  issueType: 'Epic',
                  summary: 'Epic Title',
                  description: 'Epic description',
                  priority: 'High',
                  labels: ['tag1', 'tag2']
                }
              }
            },
            requiredFields: ['issueType', 'summary']
          },
          createStory: {
            description: 'Create a JIRA Story',
            example: {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'create_issue',
                arguments: {
                  projectKey: 'SA1',
                  issueType: 'Story',
                  summary: 'As a user, I want to...',
                  description: '# Acceptance Criteria\n- [ ] Criterion 1\n- [ ] Criterion 2',
                  priority: 'High'
                }
              }
            },
            requiredFields: ['issueType', 'summary']
          },
          searchIssues: {
            description: 'Search JIRA issues with JQL',
            example: {
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'search_issues',
                arguments: {
                  jql: 'project = SA1 AND status = "In Progress"',
                  maxResults: 10
                }
              }
            }
          },
          linkIssues: {
            description: 'Link a story to an epic',
            example: {
              jsonrpc: '2.0',
              id: 4,
              method: 'tools/call',
              params: {
                name: 'link_issues',
                arguments: {
                  fromIssueKey: 'SA1-2',
                  toIssueKey: 'SA1-1',
                  linkType: 'Relates'
                }
              }
            }
          }
        },
        availableTools: [
          'create_issue', 'update_issue', 'search_issues', 'get_issue_details',
          'transition_issue', 'add_comment', 'link_issues', 'get_current_user',
          'get_project_details', 'get_boards', 'get_sprints'
        ],
        validValues: {
          issueTypes: ['Epic', 'Story', 'Task', 'Bug', 'Sub-task'],
          priorities: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
          linkTypes: ['Blocks', 'Clones', 'Duplicate', 'Relates']
        },
        listAllTools: {
          description: 'Get complete list of tools with schemas',
          example: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          }
        },
        documentation: 'https://github.com/your-repo/docs/VISHKAR-JIRA-EPIC-STORY-FORMAT.md',
        support: {
          health: 'GET /health',
          howto: 'GET /howto',
          logs: 'docker logs prometheus-jira-mcp-auth'
        }
      });
    });

    // Main MCP endpoint with authentication
    this.app.post('/mcp', async (req, res) => {
      try {
        // Extract API key from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header. Expected: Authorization: Bearer {projectApiKey}'
          });
        }

        const apiKey = authHeader.replace('Bearer ', '').trim();

        // Lookup project config from registry
        const projectConfig = await this.getProjectConfig(apiKey);
        if (!projectConfig) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key or project not found'
          });
        }

        const jiraConfig = projectConfig.configs.jira;
        if (!jiraConfig) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Project does not have JIRA configuration'
          });
        }

        console.log(`🔑 Request from project: ${projectConfig.projectName} (${projectConfig.projectId})`);

        // Execute MCP request with project-specific credentials
        const result = await this.executeMCPRequest(req.body, jiraConfig);
        
        // Check if result contains an error and enhance it
        if (result.error) {
          const enhanced = this.enhanceMCPErrorResult(result, req.body);
          res.json(enhanced);
        } else {
          res.json(result);
        }

      } catch (error) {
        console.error('❌ MCP request failed:', error);
        
        // Enhanced error response with helpful documentation
        const errorResponse = this.buildEnhancedErrorResponse(error, req.body);
        
        res.status(errorResponse.statusCode || 500).json(errorResponse.body);
      }
    });
  }

  enhanceMCPErrorResult(result, requestBody) {
    // Enhance MCP JSON-RPC error responses with helpful documentation
    const toolName = requestBody?.params?.name || 'unknown';
    const args = requestBody?.params?.arguments || {};
    const errorMessage = result.error?.message || '';
    
    // Add help section to the error
    result.error.help = {};
    result.error.yourRequest = {
      tool: toolName,
      arguments: args
    };
    
    // 400 Bad Request errors
    if (errorMessage.includes('400 Bad Request')) {
      result.error.help = ERROR_HELP.createIssue400;
      result.error.suggestion = 'Check field names and required fields. See help.correctFormat for proper structure.';
    }
    // Missing required fields
    else if (errorMessage.includes('required')) {
      result.error.help.requiredFields = ERROR_HELP.validation.requiredFields[toolName] || [];
      result.error.help.validIssueTypes = ERROR_HELP.validation.validIssueTypes;
      result.error.help.validPriorities = ERROR_HELP.validation.validPriorities;
    }
    // Generic MCP errors
    else {
      result.error.help.availableTools = [
        'create_issue', 'update_issue', 'search_issues', 'get_issue_details',
        'transition_issue', 'add_comment', 'link_issues'
      ];
      result.error.help.documentation = 'Use tools/list to see all available tools';
    }
    
    // Always add quick start guide
    result.error.quickStart = {
      listTools: 'POST /mcp with method="tools/list" to see all available tools and schemas',
      formatGuide: 'See VISHKAR-JIRA-EPIC-STORY-FORMAT.md for complete format documentation',
      testEndpoint: 'GET /health to verify service status'
    };
    
    return result;
  }

  buildEnhancedErrorResponse(error, requestBody) {
    const errorMessage = error.message || String(error);
    const toolName = requestBody?.params?.name || 'unknown';
    const args = requestBody?.params?.arguments || {};
    
    // Detect error type and provide contextual help
    let response = {
      statusCode: 500,
      body: {
        success: false,
        error: 'JIRA MCP Error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: requestBody?.id || null
      }
    };
    
    // 400 Bad Request from JIRA (format errors)
    if (errorMessage.includes('400 Bad Request') || errorMessage.includes('Jira API error: 400')) {
      response.statusCode = 400;
      response.body.error = 'Invalid JIRA Request Format';
      response.body.help = ERROR_HELP.createIssue400;
      response.body.yourRequest = {
        tool: toolName,
        arguments: args
      };
      response.body.suggestion = 'Check that issueType is exact case (e.g., "Epic" not "epic") and all required fields are present';
    }
    
    // Missing required fields
    else if (errorMessage.includes('Missing required') || errorMessage.includes('required field')) {
      response.statusCode = 400;
      response.body.error = 'Missing Required Fields';
      response.body.help = {
        requiredFields: ERROR_HELP.validation.requiredFields[toolName] || [],
        validIssueTypes: ERROR_HELP.validation.validIssueTypes,
        validPriorities: ERROR_HELP.validation.validPriorities,
        documentation: 'See VISHKAR-JIRA-EPIC-STORY-FORMAT.md'
      };
    }
    
    // Generic MCP errors
    else if (errorMessage.includes('MCP error')) {
      response.body.help = {
        availableTools: [
          'create_issue', 'update_issue', 'search_issues', 'get_issue_details',
          'transition_issue', 'add_comment', 'link_issues', 'get_current_user',
          'get_project_details', 'get_boards', 'get_sprints'
        ],
        documentation: 'Use tools/list to see all available tools and their schemas',
        examples: ERROR_HELP.createIssue400.examples
      };
    }
    
    // Add common help for all errors
    response.body.quickStart = {
      listTools: 'POST /mcp with method="tools/list" to see all available tools',
      getHelp: 'GET /health for service status',
      documentation: 'https://github.com/your-repo/docs/VISHKAR-JIRA-EPIC-STORY-FORMAT.md'
    };
    
    return response;
  }

  async getProjectConfig(apiKey) {
    try {
      const response = await fetch(`${REGISTRY_URL}/api/projects/${apiKey}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.project;
    } catch (error) {
      console.error('❌ Failed to lookup project:', error);
      return null;
    }
  }

  async executeMCPRequest(mcpRequest, jiraConfig) {
    return new Promise((resolve, reject) => {
      // Spawn MCP process with project-specific credentials
      const mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          JIRA_BASE_URL: jiraConfig.url || jiraConfig.host, // Support both 'url' and 'host' fields
          JIRA_EMAIL: jiraConfig.email,
          JIRA_API_TOKEN: jiraConfig.token,
          JIRA_PROJECT_KEY: jiraConfig.projectKey || '',
          JIRA_STORY_POINTS_FIELD: jiraConfig.storyPointsField || 'customfield_10016',
          JIRA_SPRINT_FIELD: jiraConfig.sprintField || 'customfield_10020',
          JIRA_EPIC_FIELD: jiraConfig.epicField || 'customfield_10014',
          LOG_LEVEL: 'ERROR' // Reduce noise for per-request spawns
        }
      });

      let responseBuffer = '';
      let errorOutput = '';
      const timeout = setTimeout(() => {
        mcpProcess.kill();
        reject(new Error('Request timeout after 120 seconds'));
      }, 120000);

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

      // Send request to MCP
      mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
      mcpProcess.stdin.end();
    });
  }

  start(port = 8183) {
    this.app.listen(port, () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════════════════════');
      console.log('   Jira MCP Wrapper (Authentication-enabled)');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📍 Listening on: http://localhost:${port}`);
      console.log(`🔐 Auth Method: Authorization: Bearer {projectApiKey}`);
      console.log(`📡 Registry:    ${REGISTRY_URL}`);
      console.log('');
      console.log('Usage:');
      console.log('  POST /mcp');
      console.log('  Header: Authorization: Bearer {projectApiKey}');
      console.log('  Body: MCP JSON-RPC request');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    });
  }
}

// Start the wrapper
const wrapper = new JiraMCPWrapperAuth();
const port = process.env.PORT || 8183;
wrapper.start(port);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully');
  process.exit(0);
});
