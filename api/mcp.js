// Vercel Serverless Function for JIRA MCP
// Accepts JSON-RPC 2.0 format with Authorization: Bearer {apiKey}

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_URL = process.env.REGISTRY_URL || 'https://project-registry-henna.vercel.app';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Jira MCP Wrapper (Authentication-enabled)',
      version: '1.0.0',
      authMethod: 'Authorization: Bearer {projectApiKey}',
      registryUrl: REGISTRY_URL,
      format: 'JSON-RPC 2.0',
      endpoint: {
        url: 'POST /api/mcp',
        contentType: 'application/json',
        format: 'JSON-RPC 2.0'
      },
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
            priority: 'High'
          }
        }
      }
    });
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

    console.log(`🔑 Request from project: ${projectConfig.projectName} (${projectConfig.projectId})`);

    // Execute MCP request with project-specific credentials
    const result = await executeMCPRequest(mcpRequest, jiraConfig);

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
    const response = await fetch(`${REGISTRY_URL}/api/projects?apiKey=${encodeURIComponent(apiKey)}`);
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
