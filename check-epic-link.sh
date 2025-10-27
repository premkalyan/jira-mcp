#!/bin/bash

# Fetch config from project registry
echo "Fetching config from project registry..."
CONFIG=$(curl -s 'https://project-registry-henna.vercel.app/api/project?apiKey=pk_NTWl4DhbqsJ2xflMRtT9rhRJEj8FxQW-YCMPABtapFQ' \
  -H 'Authorization: Bearer gHVVicuhDyBei+w+rMDI5+iw5ShN5gNL4yTwvfKBMe0=')

BASE_URL=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['baseUrl'])")
EMAIL=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['email'])")
TOKEN=$(echo "$CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['project']['configs']['jira']['apiToken'])")

echo "Using Jira: $BASE_URL"
echo ""

echo "Checking SA1-62 (Epic)..."
curl -s "$BASE_URL/rest/api/3/issue/SA1-62" \
  -u "$EMAIL:$TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✅ Key:', d['key'])
    print('✅ Type:', d['fields']['issuetype']['name'])
    print('✅ Summary:', d['fields']['summary'])
    print('')
except Exception as e:
    print('❌ Error:', e)
    import traceback
    traceback.print_exc()
"

echo "Checking SA1-63 (Story)..."
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

    # Check parent field
    parent = d['fields'].get('parent')
    if parent:
        print('✅ Parent (Method 1):', parent.get('key'), '-', parent.get('fields', {}).get('summary'))
    else:
        print('❌ Parent (Method 1): NO PARENT LINK')

    # Check epic link field (customfield_10014)
    epic_link = d['fields'].get('customfield_10014')
    if epic_link:
        print('✅ Epic Link (Method 2 - customfield_10014):', epic_link)
    else:
        print('❌ Epic Link (Method 2): NO EPIC LINK')

    print('')
    print('All custom fields:')
    for key, value in d['fields'].items():
        if key.startswith('customfield') and value:
            print(f'  {key}: {str(value)[:100]}')

except Exception as e:
    print('❌ Error:', e)
    import traceback
    traceback.print_exc()
"
