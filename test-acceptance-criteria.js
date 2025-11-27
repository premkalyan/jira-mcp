#!/usr/bin/env node

/**
 * Test script specifically for Acceptance Criteria and Technical Tasks
 * Tests against deployed Vercel endpoint
 */

const API_URL = 'https://jira-mcp-pi.vercel.app/api/mcp';
const BEARER_TOKEN = 'pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ';

async function makeRequest(toolName, args = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 10000),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { error: { message: error.message } };
  }
}

async function testAcceptanceCriteria() {
  console.log('🧪 Testing Acceptance Criteria & Technical Tasks');
  console.log('=' .repeat(70));
  console.log(`📡 API Endpoint: ${API_URL}`);
  console.log('=' .repeat(70));
  console.log('');

  // Test 1: Create issue with acceptance criteria and technical tasks
  console.log('\n📝 Test 1: Create Story with AC and Technical Tasks');
  console.log('-'.repeat(70));

  const testStory = {
    projectKey: 'VIS',
    issueType: 'Story',
    summary: '[TEST] Password Reset Feature - AC Test',
    description: 'As a student user who forgot my password, I want to reset it securely via email so that I can regain access to my account.',
    acceptance_criteria: [
      'User can request password reset via email',
      'Reset link expires after 1 hour',
      'User can set new password meeting security requirements',
      'Old password is invalidated after successful reset',
      'User receives confirmation email after password change'
    ],
    technical_tasks: [
      'Implement password reset endpoint',
      'Create email template service',
      'Add rate limiting middleware',
      'Implement token expiration logic',
      'Add password validation rules'
    ],
    priority: 'Medium',
    labels: ['test', 'acceptance-criteria-test']
  };

  console.log('Creating story with:');
  console.log('  - Summary:', testStory.summary);
  console.log('  - Acceptance Criteria:', testStory.acceptance_criteria.length, 'items');
  console.log('  - Technical Tasks:', testStory.technical_tasks.length, 'items');
  console.log('');

  const createResult = await makeRequest('create_issue', testStory);

  if (createResult.error) {
    console.log('❌ FAILED to create issue');
    console.log('Error:', createResult.error.message);
    return;
  }

  if (!createResult.result) {
    console.log('❌ FAILED - No result returned');
    console.log('Response:', JSON.stringify(createResult, null, 2));
    return;
  }

  const resultText = createResult.result.content[0].text;
  console.log('✅ Story created successfully!');
  console.log('');
  console.log('Response:', resultText);
  console.log('');

  // Extract issue key from response
  const issueKeyMatch = resultText.match(/\*\*Issue Key\*\*: ([A-Z]+-\d+)/);
  if (!issueKeyMatch) {
    console.log('⚠️  Could not extract issue key from response');
    return;
  }

  const issueKey = issueKeyMatch[1];
  console.log('📋 Created Issue:', issueKey);
  console.log('');

  // Test 2: Retrieve the issue and verify AC and Technical Tasks are in description
  console.log('\n🔍 Test 2: Verify AC and Technical Tasks in Issue Description');
  console.log('-'.repeat(70));

  const detailsResult = await makeRequest('get_issue_details', {
    issueKey: issueKey,
    includeComments: false
  });

  if (detailsResult.error) {
    console.log('❌ FAILED to retrieve issue details');
    console.log('Error:', detailsResult.error.message);
    return;
  }

  const detailsText = detailsResult.result.content[0].text;
  console.log('Issue Details Retrieved:');
  console.log('');
  console.log(detailsText);
  console.log('');

  // Check if AC and Technical Tasks are present
  const hasAcceptanceCriteria = detailsText.includes('Acceptance Criteria') || 
                                 detailsText.includes('acceptance criteria') ||
                                 detailsText.includes('User can request password reset');
  
  const hasTechnicalTasks = detailsText.includes('Technical Tasks') || 
                            detailsText.includes('technical tasks') ||
                            detailsText.includes('Implement password reset endpoint');

  console.log('Verification Results:');
  console.log('  - Has Acceptance Criteria:', hasAcceptanceCriteria ? '✅ YES' : '❌ NO');
  console.log('  - Has Technical Tasks:', hasTechnicalTasks ? '✅ YES' : '❌ NO');
  console.log('');

  if (hasAcceptanceCriteria && hasTechnicalTasks) {
    console.log('🎉 SUCCESS! Acceptance Criteria and Technical Tasks are properly formatted in JIRA!');
  } else {
    console.log('⚠️  WARNING: Some fields may be missing from the JIRA issue description');
    console.log('');
    console.log('Please check the issue in JIRA web interface:');
    console.log(`https://premkalyan.atlassian.net/browse/${issueKey}`);
  }

  console.log('');
  console.log('=' .repeat(70));
  console.log('✅ Test completed!');
  console.log(`🔗 View issue: https://premkalyan.atlassian.net/browse/${issueKey}`);
  console.log('=' .repeat(70));
}

// Run the test
testAcceptanceCriteria().catch(console.error);

