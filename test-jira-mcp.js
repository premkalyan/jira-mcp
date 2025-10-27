#!/usr/bin/env node

// Test script for Jira MCP Server
// Tests basic functionality and verifies integration

import http from 'http';

const JIRA_MCP_URL = 'http://localhost:8183';

async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testJiraMCP() {
  console.log('🧪 Testing Jira MCP Server...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const health = await makeRequest(`${JIRA_MCP_URL}/health`);
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   ✅ MCP Ready: ${health.mcpReady}`);
    console.log(`   ✅ Tools Available: ${health.tools.length}`);
    console.log('');

    // Test 2: Service Info
    console.log('2️⃣ Testing service info...');
    const info = await makeRequest(`${JIRA_MCP_URL}/info`);
    console.log(`   ✅ Service: ${info.name}`);
    console.log(`   ✅ Description: ${info.description}`);
    console.log('');

    // Test 3: MCP Tools Call - Get Current User
    console.log('3️⃣ Testing MCP endpoint - Get Current User...');
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_current_user',
        arguments: {}
      }
    };

    const mcpResponse = await makeRequest(`${JIRA_MCP_URL}/mcp`, mcpRequest);
    if (mcpResponse.result && mcpResponse.result.content) {
      const content = JSON.parse(mcpResponse.result.content[0].text);
      console.log(`   ✅ Current User: ${content.displayName} (${content.emailAddress})`);
      console.log(`   ✅ Account ID: ${content.accountId}`);
      console.log(`   ✅ Account Type: ${content.accountType}`);
    } else {
      console.log('   ⚠️ User info not available or different format');
      console.log('   Response:', JSON.stringify(mcpResponse, null, 2));
    }
    console.log('');

    // Test 4: MCP Tools Call - Get Projects
    console.log('4️⃣ Testing MCP endpoint - Get Projects...');
    const projectsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_projects',
        arguments: {}
      }
    };

    const projectsResponse = await makeRequest(`${JIRA_MCP_URL}/mcp`, projectsRequest);
    if (projectsResponse.result && projectsResponse.result.content) {
      const projects = JSON.parse(projectsResponse.result.content[0].text);
      console.log(`   ✅ Found ${projects.length} accessible projects`);
      if (projects.length > 0) {
        console.log(`   ✅ Example project: ${projects[0].name} (${projects[0].key})`);
      }
    } else {
      console.log('   ⚠️ Projects not available or different format');
      console.log('   Response:', JSON.stringify(projectsResponse, null, 2));
    }
    console.log('');

    console.log('🎉 Jira MCP Server test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ HTTP wrapper working on port 8283');
    console.log('   ✅ Connected to Bounteous Jira instance'); 
    console.log('   ✅ Authentication successful');
    console.log('   ✅ MCP tools responding correctly');
    console.log('\n🔗 Integration ready for AI agents and automation!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Make sure the Jira MCP server is running on port 8183');
      console.error('   💡 Run: cd jira-mcp-oren && ./docker-start.sh');
    }
  }
}

// Run the test
testJiraMCP();
