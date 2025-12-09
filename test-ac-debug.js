#!/usr/bin/env node

/**
 * Debug test to see what's being sent to the MCP
 */

const API_URL = 'https://jira-mcp-pi.vercel.app/api/mcp';
const BEARER_TOKEN = 'pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ';

async function testRequest() {
  console.log('🔍 Debug Test: Acceptance Criteria & Technical Tasks');
  console.log('=' .repeat(70));
  
  const testPayload = {
    jsonrpc: '2.0',
    id: 12345,
    method: 'tools/call',
    params: {
      name: 'create_issue',
      arguments: {
        projectKey: 'VIS',
        issueType: 'Story',
        summary: '[TEST] AC Debug Test',
        description: 'Test description for AC',
        acceptance_criteria: [
          'First acceptance criterion',
          'Second acceptance criterion',
          'Third acceptance criterion'
        ],
        technical_tasks: [
          'First technical task',
          'Second technical task',
          'Third technical task'
        ],
        priority: 'Medium',
        labels: ['test', 'debug']
      }
    }
  };

  console.log('\n📤 Sending Request:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('\n📥 Response Body:');
    console.log(JSON.stringify(result, null, 2));

    if (result.error) {
      console.log('\n❌ Error:', result.error.message);
      console.log('\nThis might be due to:');
      console.log('  1. Vercel deployment still in progress (wait 1-2 minutes)');
      console.log('  2. Environment variables not set in Vercel');
      console.log('  3. JIRA credentials expired or invalid');
      console.log('\nCheck Vercel dashboard: https://vercel.com/premkalyans-projects/jira-mcp');
    } else if (result.result) {
      console.log('\n✅ Success! Issue created with AC and Technical Tasks');
      const text = result.result.content[0].text;
      const issueKeyMatch = text.match(/\*\*Issue Key\*\*: ([A-Z]+-\d+)/);
      if (issueKeyMatch) {
        console.log(`\n🔗 View issue: https://premkalyan.atlassian.net/browse/${issueKeyMatch[1]}`);
      }
    }
  } catch (error) {
    console.log('\n❌ Exception:', error.message);
  }

  console.log('\n' + '=' .repeat(70));
}

testRequest().catch(console.error);


