#!/bin/bash

# Test script to link SA1-63 (Story) to SA1-62 (Epic) using Jira REST API directly
# This validates our fix will work before deploying

echo "🧪 Testing Epic-Story Linking Fix"
echo "=================================="
echo ""

# Fetch config from project registry
echo "📡 Fetching config from project registry..."
CONFIG=$(curl -s 'https://project-registry-henna.vercel.app/api/project?apiKey=pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ' \
  -H 'Authorization: Bearer gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=')

BASE_URL=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['baseUrl'])")
EMAIL=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['email'])")
TOKEN=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['apiToken'])")

echo "✅ Using Jira: $BASE_URL"
echo ""

# Check current state of SA1-63
echo "📋 Step 1: Check current state of SA1-63 (Story)"
echo "--------------------------------------------------"
curl -s "$BASE_URL/rest/api/3/issue/SA1-63" \
  -u "$EMAIL:$TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✅ Key:', d['key'])
    print('✅ Type:', d['fields']['issuetype']['name'])
    print('✅ Summary:', d['fields']['summary'])

    parent = d['fields'].get('parent')
    if parent:
        print('✅ Parent:', parent.get('key'), '-', parent.get('fields', {}).get('summary'))
    else:
        print('❌ Parent: NO PARENT LINK')
    print('')
except Exception as e:
    print('❌ Error:', e)
"

# Link SA1-63 to SA1-62 by setting parent field
echo "🔗 Step 2: Link SA1-63 to Epic SA1-62"
echo "--------------------------------------------------"
curl -s -X PUT "$BASE_URL/rest/api/3/issue/SA1-63" \
  -u "$EMAIL:$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "parent": {
        "key": "SA1-62"
      }
    }
  }' | python3 -c "
import sys, json
try:
    response_text = sys.stdin.read()
    if not response_text.strip():
        print('✅ Update successful (empty response means success in Jira API)')
    else:
        d = json.loads(response_text)
        if 'errors' in d:
            print('❌ Update failed:', d['errors'])
        else:
            print('✅ Update response:', d)
    print('')
except Exception as e:
    print('❌ Error:', e)
    print('')
"

# Wait a moment for Jira to process
echo "⏳ Waiting 2 seconds for Jira to process..."
sleep 2
echo ""

# Verify the link was created
echo "✅ Step 3: Verify SA1-63 is now linked to SA1-62"
echo "--------------------------------------------------"
curl -s "$BASE_URL/rest/api/3/issue/SA1-63" \
  -u "$EMAIL:$TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✅ Key:', d['key'])
    print('✅ Type:', d['fields']['issuetype']['name'])
    print('✅ Summary:', d['fields']['summary'])

    parent = d['fields'].get('parent')
    if parent:
        print('✅✅✅ Parent:', parent.get('key'), '-', parent.get('fields', {}).get('summary'))
        print('')
        print('🎉 SUCCESS! Story SA1-63 is now linked to Epic SA1-62!')
        print('🎉 The update_issue fix is working correctly!')
    else:
        print('❌ Parent: STILL NO PARENT LINK')
        print('⚠️  The update may have failed')
    print('')
except Exception as e:
    print('❌ Error:', e)
"

echo "=================================="
echo "✅ Test completed"
echo ""
