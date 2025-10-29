# VISHKAR Integration Guide: Creating Stories with Acceptance Criteria

**Version**: 2.0
**Last Updated**: 2025-10-29
**Integration**: VISHKAR → StoryCrafter → Jira MCP

---

## Overview

This guide explains how to use Jira MCP's enhanced `create_issue` tool to create user stories with **acceptance criteria** and **technical tasks** from VISHKAR-generated backlogs via StoryCrafter.

### What's New in v2.0

✨ **New Parameters**:
- `acceptance_criteria` - Array of detailed, testable acceptance criteria (4-7 items recommended)
- `technical_tasks` - Array of specific implementation tasks (4-7 items recommended)

✨ **Rich Formatting**:
- Automatically formatted as beautiful bullet lists in Jira
- Clear section headings ("Acceptance Criteria", "Technical Tasks")
- Maintains all StoryCrafter quality indicators (Given-When-Then, Edge Cases, Non-Functional)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Complete Story Creation Examples](#complete-story-creation-examples)
3. [API Reference](#api-reference)
4. [StoryCrafter → Jira Mapping](#storycrafter--jira-mapping)
5. [Best Practices](#best-practices)
6. [Error Handling](#error-handling)
7. [Testing Examples](#testing-examples)

---

## Quick Start

### Basic Story with Acceptance Criteria

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Story",
      "summary": "User Registration Flow",
      "description": "As a new user, I want to register an account so that I can access the platform",
      "acceptance_criteria": [
        "GIVEN user is on registration page WHEN they enter valid email and password THEN account is created successfully",
        "System validates email format and displays specific error messages for invalid formats",
        "User can complete registration within 3 seconds under normal conditions",
        "[Edge case]: System handles duplicate email by showing friendly error message"
      ],
      "technical_tasks": [
        "Create POST /api/auth/register endpoint with validation",
        "Implement bcrypt password hashing with salt",
        "Build registration form component in React",
        "Add email validation service with regex and DNS check"
      ],
      "priority": "High"
    }
  }
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# ✅ Issue Created Successfully!\n\n**Issue Key**: SA1-69\n**Summary**: User Registration Flow\n**Project**: SA1\n**Type**: Story\n**Priority**: High\n\n## Quick Actions\n- View details: Use `get_issue_details` with key: SA1-69\n- Add comment: Use `add_comment` with key: SA1-69\n- Transition: Use `transition_issue` to change status\n\n🔗 **View in Jira**: [SA1-69](https://bounteous.jira.com/browse/SA1-69)"
      }
    ]
  }
}
```

The story will appear in Jira with:
```
As a new user, I want to register an account so that I can access the platform

### Acceptance Criteria
• GIVEN user is on registration page WHEN they enter valid email and password THEN account is created successfully
• System validates email format and displays specific error messages for invalid formats
• User can complete registration within 3 seconds under normal conditions
• [Edge case]: System handles duplicate email by showing friendly error message

### Technical Tasks
• Create POST /api/auth/register endpoint with validation
• Implement bcrypt password hashing with salt
• Build registration form component in React
• Add email validation service with regex and DNS check
```

---

## Complete Story Creation Examples

### Example 1: Full Story from StoryCrafter

**StoryCrafter Output**:
```json
{
  "id": "EPIC-1-1",
  "title": "User Login with OAuth",
  "description": "As a user, I want to login with social media accounts so that I can access the platform quickly",
  "acceptance_criteria": [
    "GIVEN user is on login page WHEN they click 'Login with Google' THEN OAuth flow initiates",
    "System redirects to Google OAuth consent screen with correct scopes",
    "User can complete OAuth login within 5 seconds under normal network conditions",
    "[Edge case]: System handles OAuth denial by showing friendly message and login alternatives",
    "[Edge case]: System prevents duplicate accounts by checking email across auth methods",
    "[Non-functional]: OAuth tokens encrypted and stored securely with 7-day expiration",
    "[Security]: User sessions invalidated after 30 minutes of inactivity"
  ],
  "technical_tasks": [
    "Integrate Google OAuth 2.0 SDK and configure client credentials",
    "Create POST /api/auth/oauth/google endpoint for callback handling",
    "Implement JWT token generation with refresh token rotation",
    "Build OAuth login buttons in React with proper error boundaries",
    "Add session management with Redis for token storage",
    "Implement automatic session refresh before token expiration",
    "Write integration tests for OAuth flow with mocked Google responses"
  ],
  "priority": "P0",
  "story_points": 8,
  "estimated_hours": 16,
  "tags": ["mvp", "backend", "frontend", "security"],
  "layer": "fullstack"
}
```

**Jira MCP Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Story",
      "summary": "User Login with OAuth",
      "description": "As a user, I want to login with social media accounts so that I can access the platform quickly",
      "acceptance_criteria": [
        "GIVEN user is on login page WHEN they click 'Login with Google' THEN OAuth flow initiates",
        "System redirects to Google OAuth consent screen with correct scopes",
        "User can complete OAuth login within 5 seconds under normal network conditions",
        "[Edge case]: System handles OAuth denial by showing friendly message and login alternatives",
        "[Edge case]: System prevents duplicate accounts by checking email across auth methods",
        "[Non-functional]: OAuth tokens encrypted and stored securely with 7-day expiration",
        "[Security]: User sessions invalidated after 30 minutes of inactivity"
      ],
      "technical_tasks": [
        "Integrate Google OAuth 2.0 SDK and configure client credentials",
        "Create POST /api/auth/oauth/google endpoint for callback handling",
        "Implement JWT token generation with refresh token rotation",
        "Build OAuth login buttons in React with proper error boundaries",
        "Add session management with Redis for token storage",
        "Implement automatic session refresh before token expiration",
        "Write integration tests for OAuth flow with mocked Google responses"
      ],
      "priority": "Highest",
      "labels": ["mvp", "backend", "frontend", "security"],
      "parentKey": "SA1-62"
    }
  }
}
```

---

### Example 2: Epic Creation

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Epic",
      "summary": "User Authentication & Authorization",
      "description": "Implement complete authentication system with OAuth 2.0 support, role-based access control, and session management",
      "priority": "High",
      "labels": ["mvp", "security", "infrastructure"]
    }
  }
}
```

**Returns**: Epic key (e.g., "SA1-70") to use as `parentKey` for stories

---

### Example 3: Link Story to Existing Epic

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "projectKey": "SA1",
      "issueType": "Story",
      "summary": "Password Reset Flow",
      "description": "As a user, I want to reset my forgotten password so that I can regain access to my account",
      "acceptance_criteria": [
        "GIVEN user clicks 'Forgot Password' WHEN they enter registered email THEN reset link is sent",
        "User receives password reset email within 30 seconds",
        "Reset link expires after 1 hour for security",
        "[Edge case]: System handles non-existent email without revealing account existence"
      ],
      "technical_tasks": [
        "Create POST /api/auth/forgot-password endpoint",
        "Implement secure token generation with 1-hour expiration",
        "Build password reset form with strength validation",
        "Add email service integration for reset link delivery"
      ],
      "priority": "High",
      "parentKey": "SA1-70"
    }
  }
}
```

---

## API Reference

### create_issue Tool

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectKey` | `string` | ❌ No | Project key (uses registry config if omitted) |
| `issueType` | `string` | ✅ Yes | Issue type: `"Story"`, `"Epic"`, `"Task"`, `"Bug"` |
| `summary` | `string` | ✅ Yes | Issue title/summary (concise, 1 line) |
| `description` | `string` | ❌ No | User story description (As a... I want... so that...) |
| `acceptance_criteria` | `string[]` | ❌ No | Array of acceptance criteria (4-7 recommended) |
| `technical_tasks` | `string[]` | ❌ No | Array of implementation tasks (4-7 recommended) |
| `priority` | `string` | ❌ No | Priority: `"Highest"`, `"High"`, `"Medium"`, `"Low"`, `"Lowest"` |
| `assignee` | `string` | ❌ No | User account ID |
| `labels` | `string[]` | ❌ No | Labels/tags (e.g., `["mvp", "backend"]`) |
| `components` | `string[]` | ❌ No | Component names |
| `fixVersions` | `string[]` | ❌ No | Target version names |
| `dueDate` | `string` | ❌ No | Due date (ISO format: `"2025-12-31"`) |
| `parentKey` | `string` | ❌ No | Epic key to link story to (e.g., `"SA1-62"`) |

**Response Structure**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# ✅ Issue Created Successfully!\n\n**Issue Key**: SA1-69\n**Summary**: User Registration Flow\n**Project**: SA1\n**Type**: Story\n**Priority**: High\n\n🔗 **View in Jira**: [SA1-69](https://bounteous.jira.com/browse/SA1-69)"
      }
    ]
  }
}
```

**Key Fields to Extract**:
- Issue Key: Matches pattern `**Issue Key**: (SA1-\d+)`
- Jira URL: Extract from markdown link `[SA1-69](URL)`

---

### update_issue Tool

Update existing story with new acceptance criteria or tasks:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "update_issue",
    "arguments": {
      "issueKey": "SA1-69",
      "acceptance_criteria": [
        "Updated criterion 1",
        "Updated criterion 2",
        "New criterion 3"
      ],
      "technical_tasks": [
        "Updated task 1",
        "New task 2"
      ]
    }
  }
}
```

---

## StoryCrafter → Jira Mapping

### Field Mapping Table

| StoryCrafter Field | Jira MCP Parameter | Notes |
|-------------------|-------------------|-------|
| `title` | `summary` | Direct mapping |
| `description` | `description` | User story text |
| `acceptance_criteria[]` | `acceptance_criteria[]` | Array of strings |
| `technical_tasks[]` | `technical_tasks[]` | Array of strings |
| `priority` ("P0", "P1", "P2", "P3") | `priority` | Map to Jira priorities (see below) |
| `story_points` | N/A | Not yet supported in create_issue |
| `tags[]` | `labels[]` | Direct mapping |
| `parentKey` (epic ID) | `parentKey` | Epic-story link |

### Priority Mapping

| StoryCrafter | Jira MCP |
|--------------|----------|
| P0 (Critical) | `"Highest"` |
| P1 (High) | `"High"` |
| P2 (Medium) | `"Medium"` |
| P3 (Low) | `"Low"` |

### Python Mapping Function

```python
def map_storycrafter_to_jira(story: dict, epic_key: str = None) -> dict:
    """
    Map StoryCrafter story to Jira MCP create_issue arguments.

    Args:
        story: StoryCrafter story object
        epic_key: Optional epic key to link story to

    Returns:
        Dict ready for Jira MCP create_issue
    """
    priority_map = {
        "P0": "Highest",
        "P1": "High",
        "P2": "Medium",
        "P3": "Low"
    }

    jira_args = {
        "issueType": "Story",
        "summary": story["title"],
        "description": story["description"],
        "acceptance_criteria": story["acceptance_criteria"],
        "technical_tasks": story["technical_tasks"],
        "priority": priority_map.get(story["priority"], "Medium"),
        "labels": story.get("tags", [])
    }

    if epic_key:
        jira_args["parentKey"] = epic_key

    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "create_issue",
            "arguments": jira_args
        }
    }
```

---

## Best Practices

### 1. Acceptance Criteria Quality

✅ **DO**:
- Include 4-7 detailed, testable criteria per story
- Use Given-When-Then format for clarity
- Include edge cases with `[Edge case]:` prefix
- Add non-functional requirements with `[Non-functional]:` or `[Security]:` prefix
- Be specific and measurable

❌ **DON'T**:
- Use vague criteria like "System should work"
- Skip edge cases and error scenarios
- Omit performance or security requirements
- Create too few (<3) or too many (>10) criteria

**Example - Good**:
```json
"acceptance_criteria": [
  "GIVEN user submits valid payment WHEN processing completes THEN order confirmation displays",
  "System processes payment within 2 seconds for 95th percentile",
  "[Edge case]: System handles payment gateway timeout by auto-retrying twice",
  "[Non-functional]: Payment data encrypted end-to-end with TLS 1.3",
  "[Security]: User cannot submit payment for another user's cart"
]
```

**Example - Bad**:
```json
"acceptance_criteria": [
  "Payment should work",
  "User can pay"
]
```

---

### 2. Technical Tasks Specificity

✅ **DO**:
- Include 4-7 specific implementation tasks
- Specify exact endpoints, components, or modules
- Include testing tasks
- Mention specific technologies/libraries

❌ **DON'T**:
- Use generic tasks like "Write code"
- Skip testing tasks
- Omit technology details

---

### 3. Epic-Story Organization

**Recommended Workflow**:

1. **Create Epic First**:
```json
{
  "name": "create_issue",
  "arguments": {
    "issueType": "Epic",
    "summary": "User Authentication System",
    "description": "Complete authentication with OAuth, RBAC, and session management"
  }
}
```
Returns: `SA1-70`

2. **Create Stories Linked to Epic**:
```json
{
  "name": "create_issue",
  "arguments": {
    "issueType": "Story",
    "summary": "OAuth Login",
    "parentKey": "SA1-70",
    ...
  }
}
```

3. **Alternative: Link Later**:
```json
{
  "name": "update_issue",
  "arguments": {
    "issueKey": "SA1-69",
    "parentKey": "SA1-70"
  }
}
```

---

### 4. Batch Creation Pattern

For creating multiple stories from StoryCrafter backlog:

```python
async def create_backlog_in_jira(backlog: dict):
    """Create complete backlog in Jira from StoryCrafter output."""

    for epic in backlog["epics"]:
        # Create epic
        epic_response = await jira_mcp.call_tool("create_issue", {
            "issueType": "Epic",
            "summary": epic["title"],
            "description": epic["description"],
            "priority": epic["priority"]
        })
        epic_key = extract_issue_key(epic_response)

        # Create stories for this epic
        for story in epic["stories"]:
            await jira_mcp.call_tool("create_issue",
                map_storycrafter_to_jira(story, epic_key)
            )

            # Add delay to respect rate limits
            await asyncio.sleep(0.5)
```

---

## Error Handling

### Common Errors

#### 1. Missing Required Fields

**Error**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Failed to create issue: Field 'summary' is required"
  }
}
```

**Solution**: Ensure `issueType` and `summary` are always provided.

---

#### 2. Invalid Epic Key

**Error**:
```json
{
  "error": {
    "message": "Failed to create issue: Issue 'SA1-999' does not exist"
  }
}
```

**Solution**: Verify epic exists before linking. Create epic first if needed.

---

#### 3. Invalid Priority Value

**Error**:
```json
{
  "error": {
    "message": "Failed to create issue: Priority 'P0' is not valid"
  }
}
```

**Solution**: Use Jira priority values: `"Highest"`, `"High"`, `"Medium"`, `"Low"`, `"Lowest"`.

---

#### 4. Empty Arrays

Empty `acceptance_criteria` or `technical_tasks` arrays are valid and will be skipped:

```json
{
  "acceptance_criteria": [],  // OK - will not add section
  "technical_tasks": []        // OK - will not add section
}
```

---

## Testing Examples

### Test Script: Create Story with Full Details

```javascript
#!/usr/bin/env node

const API_URL = 'https://jira-mcp-pi.vercel.app/api/mcp';
const BEARER_TOKEN = 'your_token_here';

async function testStoryCreation() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'create_issue',
        arguments: {
          issueType: 'Story',
          summary: 'Test Story with Acceptance Criteria',
          description: 'As a tester, I want to verify acceptance criteria formatting so that I can confirm the integration works',
          acceptance_criteria: [
            'GIVEN story has acceptance criteria WHEN created in Jira THEN criteria appear as bullet list',
            'System formats criteria with "Acceptance Criteria" heading',
            '[Edge case]: Empty criteria array does not create section',
            '[Non-functional]: Formatting maintains ADF compliance'
          ],
          technical_tasks: [
            'Test API endpoint with sample data',
            'Verify ADF format in Jira UI',
            'Confirm bullet list rendering',
            'Test with edge cases (empty arrays, special characters)'
          ],
          priority: 'Medium',
          labels: ['test', 'integration']
        }
      }
    })
  });

  const result = await response.json();

  if (result.result) {
    const text = result.result.content[0].text;
    const keyMatch = text.match(/\*\*Issue Key\*\*:\s*([A-Z]+-\d+)/);

    if (keyMatch) {
      console.log('✅ Story created successfully!');
      console.log(`   Issue Key: ${keyMatch[1]}`);
      console.log(`   URL: https://bounteous.jira.com/browse/${keyMatch[1]}`);
    }
  } else if (result.error) {
    console.error('❌ Error:', result.error.message);
  }
}

testStoryCreation();
```

---

## Advanced Usage

### 1. Update Story After Creation

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "update_issue",
    "arguments": {
      "issueKey": "SA1-69",
      "acceptance_criteria": [
        "Original criterion 1 (updated)",
        "Original criterion 2",
        "NEW criterion 3 - added after review",
        "NEW criterion 4 - covers security edge case"
      ]
    }
  }
}
```

**Note**: Update replaces ALL acceptance criteria. To append, first fetch existing criteria with `get_issue_details`.

---

### 2. Acceptance Criteria Only (No Description)

```json
{
  "name": "create_issue",
  "arguments": {
    "issueType": "Story",
    "summary": "Quick Task",
    "acceptance_criteria": [
      "Criterion 1",
      "Criterion 2"
    ]
  }
}
```

Creates story with only acceptance criteria section (no description paragraph).

---

### 3. Special Characters in Criteria

All special characters are supported:

```json
{
  "acceptance_criteria": [
    "User can enter <script> tags without XSS vulnerability",
    "System handles \"quoted text\" correctly",
    "API accepts JSON with nested {objects} and [arrays]"
  ]
}
```

---

## Integration Checklist

Before deploying VISHKAR → Jira integration:

- [ ] Verify bearer token is valid and has Jira permissions
- [ ] Test epic creation and retrieve epic key
- [ ] Test story creation with all fields
- [ ] Test story creation with acceptance_criteria array
- [ ] Test story creation with technical_tasks array
- [ ] Test linking story to epic via parentKey
- [ ] Verify Jira UI displays formatted acceptance criteria and tasks
- [ ] Test error handling for invalid inputs
- [ ] Implement rate limiting (max 50 requests/min)
- [ ] Add logging for created issue keys
- [ ] Test with StoryCrafter output mapping function

---

## Support

**Issues**: [GitHub - Jira MCP](https://github.com/premkalyan/jira-mcp/issues)
**VISHKAR Integration**: Contact VISHKAR team for StoryCrafter integration support
**Jira API**: [Atlassian Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

---

**Version History**:
- **v2.0** (2025-10-29): Added acceptance_criteria and technical_tasks support
- **v1.0** (2025-10-27): Initial epic-story linking support
