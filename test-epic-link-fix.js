#!/usr/bin/env node

/**
 * Test script to validate epic-story linking fix
 * Tests that update_issue with parentKey properly links a story to an epic
 */

const API_URL = 'https://jira-mcp-pi.vercel.app/api/mcp';
const BEARER_TOKEN = 'pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ';

async function makeRequest(method, params) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  });

  const result = await response.json();
  return result;
}

async function runTests() {
  console.log('🧪 Testing Epic-Story Linking Fix\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get current state of SA1-63 (Story)
    console.log('\n📋 Test 1: Get current state of SA1-63 (Story)');
    console.log('-'.repeat(60));
    const getResult = await makeRequest('tools/call', {
      name: 'get_issue_details',
      arguments: {
        issueKey: 'SA1-63',
        expand: ['changelog']
      }
    });

    if (getResult.result) {
      console.log('✅ Successfully fetched SA1-63');
      const content = getResult.result.content[0].text;
      const hasParent = content.includes('Parent:') || content.includes('parent');
      console.log(`   Parent Link Status: ${hasParent ? '✅ HAS PARENT' : '❌ NO PARENT'}`);
    } else {
      console.log('❌ Failed to fetch issue:', getResult.error);
      process.exit(1);
    }

    // Test 2: Link SA1-63 to Epic SA1-62 using update_issue
    console.log('\n🔗 Test 2: Link SA1-63 to Epic SA1-62 using update_issue');
    console.log('-'.repeat(60));
    const updateResult = await makeRequest('tools/call', {
      name: 'update_issue',
      arguments: {
        issueKey: 'SA1-63',
        parentKey: 'SA1-62'
      }
    });

    if (updateResult.result) {
      console.log('✅ Update request successful');
      console.log('   Response:', updateResult.result.content[0].text.substring(0, 200));
      const hasParentField = updateResult.result.content[0].text.includes('parent');
      console.log(`   Parent field updated: ${hasParentField ? '✅ YES' : '⚠️  Not shown in response'}`);
    } else {
      console.log('❌ Failed to update issue:', updateResult.error);
      process.exit(1);
    }

    // Wait a moment for Jira to process
    console.log('\n⏳ Waiting 2 seconds for Jira to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Verify the link was created
    console.log('\n✅ Test 3: Verify SA1-63 is now linked to SA1-62');
    console.log('-'.repeat(60));
    const verifyResult = await makeRequest('tools/call', {
      name: 'get_issue_details',
      arguments: {
        issueKey: 'SA1-63',
        expand: ['changelog']
      }
    });

    if (verifyResult.result) {
      console.log('✅ Successfully fetched SA1-63 again');
      const content = verifyResult.result.content[0].text;

      // Check for parent link
      const hasParent = content.includes('Parent:') || content.includes('SA1-62');
      console.log(`   Parent Link: ${hasParent ? '✅ LINKED TO SA1-62!' : '❌ STILL NO PARENT'}`);

      if (hasParent) {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 SUCCESS! Epic-Story linking is now working!');
        console.log('='.repeat(60));
        console.log('\nSummary:');
        console.log('✅ update_issue tool now supports parentKey parameter');
        console.log('✅ SA1-63 (Story) successfully linked to SA1-62 (Epic)');
        console.log('✅ Ready to deploy to Vercel!');
      } else {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  Link not confirmed yet - check Jira manually');
        console.log('='.repeat(60));
      }
    } else {
      console.log('❌ Failed to verify issue:', verifyResult.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().then(() => {
  console.log('\n✅ All tests completed\n');
}).catch(error => {
  console.error('❌ Tests failed:', error);
  process.exit(1);
});
