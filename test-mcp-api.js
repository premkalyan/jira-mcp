#!/usr/bin/env node

// Test script for Jira MCP API with Project Registry integration

import handler from './api/mcp.js';

// Set environment variables
process.env.REGISTRY_URL = 'https://project-registry-henna.vercel.app';
process.env.REGISTRY_AUTH_TOKEN = 'gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=';

const BEARER_TOKEN = 'pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ';

// Mock request and response objects
function createMockRequest(method, body = null, authorization = null) {
  return {
    method,
    body,
    headers: {
      authorization: authorization ? `Bearer ${authorization}` : undefined,
      'content-type': 'application/json'
    }
  };
}

function createMockResponse() {
  let statusCode = 200;
  let headers = {};
  let responseBody = null;

  return {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseBody = data;
          return Promise.resolve();
        },
        send: (data) => {
          responseBody = data;
          return Promise.resolve();
        },
        end: () => Promise.resolve()
      };
    },
    json: (data) => {
      responseBody = data;
      return Promise.resolve();
    },
    send: (data) => {
      responseBody = data;
      return Promise.resolve();
    },
    setHeader: (name, value) => {
      headers[name] = value;
    },
    getStatusCode: () => statusCode,
    getBody: () => responseBody,
    getHeaders: () => headers
  };
}

async function testEndpoint() {
  console.log('🧪 Testing Jira MCP API with Project Registry Integration\n');

  // Test 1: GET request (service info)
  console.log('Test 1: GET /api/mcp (Service Info)');
  console.log('─'.repeat(60));
  const getReq = createMockRequest('GET');
  const getRes = createMockResponse();
  await handler(getReq, getRes);
  console.log('Status:', getRes.getStatusCode());
  console.log('Response:', JSON.stringify(getRes.getBody(), null, 2));
  console.log('\n');

  // Test 2: POST without auth (should fail)
  console.log('Test 2: POST without Authorization (Should Fail)');
  console.log('─'.repeat(60));
  const noAuthReq = createMockRequest('POST', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_current_user', arguments: {} }
  });
  const noAuthRes = createMockResponse();
  await handler(noAuthReq, noAuthRes);
  console.log('Status:', noAuthRes.getStatusCode());
  console.log('Response:', JSON.stringify(noAuthRes.getBody(), null, 2));
  console.log('\n');

  // Test 3: POST with auth - get current user
  console.log('Test 3: POST with Auth - get_current_user');
  console.log('─'.repeat(60));
  const authReq = createMockRequest(
    'POST',
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_current_user',
        arguments: {}
      }
    },
    BEARER_TOKEN
  );
  const authRes = createMockResponse();

  console.log('⏳ Executing MCP request...');
  console.log(`   Bearer Token: ${BEARER_TOKEN.substring(0, 20)}...`);
  console.log(`   Project Registry: ${process.env.REGISTRY_URL}`);
  console.log();

  try {
    await handler(authReq, authRes);
    console.log('✅ Status:', authRes.getStatusCode());
    console.log('Response:', JSON.stringify(authRes.getBody(), null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  console.log('\n');

  // Test 4: POST with auth - search issues
  console.log('Test 4: POST with Auth - search_issues');
  console.log('─'.repeat(60));
  const searchReq = createMockRequest(
    'POST',
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_issues',
        arguments: {
          jql: 'project = SA1 ORDER BY created DESC',
          maxResults: 5
        }
      }
    },
    BEARER_TOKEN
  );
  const searchRes = createMockResponse();

  console.log('⏳ Executing MCP request...');
  console.log(`   JQL: project = SA1 ORDER BY created DESC`);
  console.log();

  try {
    await handler(searchReq, searchRes);
    console.log('✅ Status:', searchRes.getStatusCode());
    const response = searchRes.getBody();

    if (response.result && response.result.content) {
      console.log('Result:', JSON.stringify(response.result.content[0], null, 2).substring(0, 500) + '...');
    } else {
      console.log('Response:', JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('\n');
}

// Run tests
testEndpoint().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
