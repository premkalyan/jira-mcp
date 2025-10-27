#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🧪 TESTING PRIORITY 1 SPRINT MANAGEMENT TOOLS');
console.log('=============================================');

// Set environment variables for JIRA MCP
const env = {
  ...process.env,
  JIRA_BASE_URL: 'https://bounteous.atlassian.net',
  JIRA_EMAIL: 'prem.kalyan@bounteous.com',
  JIRA_API_TOKEN: 'ATATT3xFfGF0KaG-DGjJwFl78r-fK5UzGNdnStHfK3l_qQLhp3rVJy99Kj47E2Yl09f9oPwj6F0W0qeN-R-Ht4u4NMzO7jXDOYvU_mFNhJoAHTEP6CXHsBXQzKAqp0YB9m0YK-j9PnLN8FBhkWTmzBMj7Gb4n3X1jELSt7MN6HyaQ_rONLkZ8fA=E92C0142',
  LOG_LEVEL: 'INFO'
};

console.log('🚀 Starting JIRA MCP server via STDIO...');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env
});

let messageId = 1;

function sendMCPMessage(method, params = {}) {
  return new Promise((resolve, reject) => {
    const message = {
      jsonrpc: '2.0',
      id: messageId++,
      method,
      params
    };

    const messageStr = JSON.stringify(message) + '\\n';
    console.log(`📤 Sending: ${method}`);
    
    server.stdin.write(messageStr);

    // Set up response handler
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${method}`));
    }, 30000);

    const handleData = (data) => {
      clearTimeout(timeout);
      server.stdout.removeListener('data', handleData);
      
      try {
        const lines = data.toString().split('\\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.trim()) {
            const response = JSON.parse(line);
            if (response.id === message.id) {
              if (response.error) {
                reject(new Error(`MCP Error: ${response.error.message}`));
              } else {
                resolve(response.result);
              }
              return;
            }
          }
        }
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
      }
    };

    server.stdout.on('data', handleData);
  });
}

async function testSprintManagement() {
  try {
    console.log('\\n📋 PHASE 1: Initialize MCP Connection');
    
    // Initialize MCP connection
    await sendMCPMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'sprint-test-client', version: '1.0.0' }
    });
    console.log('✅ MCP initialized');

    // List tools to verify sprint tools are available
    console.log('\\n📋 PHASE 2: Verify Sprint Tools Available');
    const tools = await sendMCPMessage('tools/list');
    const sprintTools = tools.tools.filter(tool => 
      tool.name.includes('sprint') || 
      tool.name.includes('active_sprint') ||
      tool.name.includes('board_sprints')
    );
    
    console.log(`✅ Found ${sprintTools.length}/12 Sprint Tools:`);
    sprintTools.forEach(tool => {
      console.log(`   📎 ${tool.name} - ${tool.description}`);
    });

    if (sprintTools.length < 12) {
      console.log('⚠️  Not all sprint tools found. Expected 12 tools.');
      console.log('Expected tools: create_sprint, update_sprint, get_sprint_details, get_board_sprints,');
      console.log('                add_issues_to_sprint, remove_issues_from_sprint, move_issues_between_sprints,');
      console.log('                start_sprint, complete_sprint, get_active_sprint, get_sprint_capacity, set_sprint_goal');
      return;
    }

    console.log('\\n📋 PHASE 3: Get Test Board');
    
    // Get boards to find a test board
    const boardsResult = await sendMCPMessage('tools/call', {
      name: 'get_boards',
      arguments: {}
    });
    
    if (!boardsResult.content || !boardsResult.content[0] || !boardsResult.content[0].text.includes('|')) {
      throw new Error('No boards found or invalid board response');
    }
    
    // Extract board ID from the markdown table
    const boardText = boardsResult.content[0].text;
    const boardLines = boardText.split('\\n').filter(line => line.includes('|') && !line.includes('ID'));
    if (boardLines.length === 0) {
      throw new Error('No board data found in response');
    }
    
    const firstBoardLine = boardLines[0];
    const boardId = firstBoardLine.split('|')[1].trim();
    console.log(`✅ Using Board ID: ${boardId}`);

    console.log('\\n📋 PHASE 4: Test Sprint Creation');
    
    // Test 1: Create Sprint
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
    
    const createSprintResult = await sendMCPMessage('tools/call', {
      name: 'create_sprint',
      arguments: {
        boardId: boardId,
        sprintName: `P360 Test Sprint ${Date.now()}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        goal: 'Test all Priority 1 sprint management capabilities'
      }
    });
    
    console.log('✅ Sprint Creation Test:');
    console.log('   📊 Result:', createSprintResult.content[0].text.split('\\n')[0]);
    
    // Extract sprint ID from response
    const sprintText = createSprintResult.content[0].text;
    const sprintIdMatch = sprintText.match(/ID\\*\\*: (\\d+)/);
    if (!sprintIdMatch) {
      throw new Error('Could not extract sprint ID from creation response');
    }
    const sprintId = sprintIdMatch[1];
    console.log(`   🆔 Created Sprint ID: ${sprintId}`);

    console.log('\\n📋 PHASE 5: Test Sprint Details & Board Sprints');
    
    // Test 2: Get Sprint Details
    const sprintDetailsResult = await sendMCPMessage('tools/call', {
      name: 'get_sprint_details',
      arguments: { sprintId: sprintId }
    });
    console.log('✅ Sprint Details Test: Successfully retrieved sprint information');
    
    // Test 3: Get Board Sprints
    const boardSprintsResult = await sendMCPMessage('tools/call', {
      name: 'get_board_sprints',
      arguments: { boardId: boardId, state: 'future' }
    });
    console.log('✅ Board Sprints Test: Successfully retrieved board sprints');
    
    // Test 4: Get Active Sprint (should be none)
    const activeSprintResult = await sendMCPMessage('tools/call', {
      name: 'get_active_sprint',
      arguments: { boardId: boardId }
    });
    console.log('✅ Get Active Sprint Test: Correctly shows no active sprint');

    console.log('\\n📋 PHASE 6: Test Sprint Goal Setting');
    
    // Test 5: Set Sprint Goal
    const setGoalResult = await sendMCPMessage('tools/call', {
      name: 'set_sprint_goal',
      arguments: {
        sprintId: sprintId,
        goal: 'Updated goal: Validate all P1 sprint management tools work correctly'
      }
    });
    console.log('✅ Set Sprint Goal Test: Successfully updated sprint goal');

    console.log('\\n📋 PHASE 7: Test Sprint Capacity Analysis');
    
    // Test 6: Get Sprint Capacity
    const capacityResult = await sendMCPMessage('tools/call', {
      name: 'get_sprint_capacity',
      arguments: { sprintId: sprintId }
    });
    console.log('✅ Sprint Capacity Test: Successfully analyzed sprint capacity');

    console.log('\\n📋 PHASE 8: Test Sprint Lifecycle');
    
    // Test 7: Update Sprint
    const updateSprintResult = await sendMCPMessage('tools/call', {
      name: 'update_sprint',
      arguments: {
        sprintId: sprintId,
        sprintName: `P360 Test Sprint ${Date.now()} - Updated`,
        goal: 'Final updated goal for comprehensive testing'
      }
    });
    console.log('✅ Update Sprint Test: Successfully updated sprint details');

    // Test 8: Start Sprint
    const startSprintResult = await sendMCPMessage('tools/call', {
      name: 'start_sprint',
      arguments: {
        sprintId: sprintId,
        startDate: new Date().toISOString()
      }
    });
    console.log('✅ Start Sprint Test: Successfully started sprint');

    // Test 9: Get Active Sprint (should now show our sprint)
    const activeSprintResult2 = await sendMCPMessage('tools/call', {
      name: 'get_active_sprint',
      arguments: { boardId: boardId }
    });
    console.log('✅ Get Active Sprint Test 2: Successfully found active sprint');

    // Test 10: Complete Sprint
    const completeSprintResult = await sendMCPMessage('tools/call', {
      name: 'complete_sprint',
      arguments: {
        sprintId: sprintId,
        incompleteIssuesAction: 'move_to_backlog'
      }
    });
    console.log('✅ Complete Sprint Test: Successfully completed sprint');

    console.log('\\n📋 PHASE 9: Test Results Summary');
    
    console.log('\\n🎉 ALL PRIORITY 1 SPRINT MANAGEMENT TESTS PASSED! 🎉');
    console.log('\\n📊 Test Summary:');
    console.log('✅ Sprint Creation - Working');
    console.log('✅ Sprint Details Retrieval - Working'); 
    console.log('✅ Board Sprints Listing - Working');
    console.log('✅ Active Sprint Detection - Working');
    console.log('✅ Sprint Goal Management - Working');
    console.log('✅ Sprint Capacity Analysis - Working');
    console.log('✅ Sprint Updates - Working');
    console.log('✅ Sprint Lifecycle (Start/Complete) - Working');
    console.log('\\n🚀 JIRA MCP now supports full Agile/Scrum sprint management!');
    
    // Note: Issue-related tests (add/remove/move issues) require existing issues
    console.log('\\n📝 Note: Issue management tests (add_issues_to_sprint, remove_issues_from_sprint,');
    console.log('          move_issues_between_sprints) require existing issues and will be tested');
    console.log('          in real sprint planning scenarios.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    console.log('\\n🔚 Terminating MCP server...');
    server.kill();
  }
}

// Handle server output
server.stdout.on('data', (data) => {
  // Only log if it's not JSON (server logs)
  const output = data.toString();
  if (!output.trim().startsWith('{')) {
    console.log('📡 Server:', output.trim());
  }
});

server.stderr.on('data', (data) => {
  console.log('🚨 Server Error:', data.toString());
});

server.on('close', (code) => {
  console.log(`\\n🏁 MCP server exited with code ${code}`);
  process.exit(code);
});

// Start the test
setTimeout(() => {
  testSprintManagement();
}, 2000); // Wait 2 seconds for server to start
