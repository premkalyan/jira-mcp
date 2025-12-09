// Vercel Serverless Function for JIRA MCP - How To Guide
// Returns JSON documentation about formats, tools, and usage

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const howto = {
    service: "JIRA MCP",
    version: "1.0.3",
    endpoint: "https://jira-mcp-pi.vercel.app/api/mcp",

    authentication: {
      method: "Bearer Token",
      header: "Authorization: Bearer {api_key}",
      how_to_get_key: [
        "1. Go to Project Registry: https://project-registry-henna.vercel.app/dashboard",
        "2. Register your project with Jira credentials (URL, email, API token)",
        "3. Copy your API key (pk_xxx...)",
        "4. Use as Bearer token in Authorization header"
      ],
      registration_endpoint: "POST https://project-registry-henna.vercel.app/api/projects/register",
      registration_body: {
        projectId: "your-project-id",
        projectName: "Your Project Name",
        configs: {
          jira: {
            url: "https://yourcompany.atlassian.net",
            email: "your-email@company.com",
            api_token: "your-jira-api-token",
            projectKey: "PROJ"
          }
        }
      }
    },

    rich_text_format: {
      name: "Atlassian Document Format (ADF)",
      important: "This MCP now AUTO-CONVERTS Markdown to ADF! Just send Markdown in description field.",
      description: "ADF is a JSON-based format for rich text in Jira Cloud. This MCP automatically detects Markdown and converts it to ADF.",

      markdown_support: {
        status: "ENABLED - Auto-detection and conversion",
        supported_syntax: [
          "## Headers (H1-H6)",
          "**bold** and *italic*",
          "`inline code` and ```code blocks```",
          "- Bullet lists",
          "1. Numbered lists",
          "| Tables | With | Headers |",
          "[Links](https://example.com)",
          "> Blockquotes",
          "--- Horizontal rules"
        ],
        example_input: "## PPQA Finding\\n\\n| Field | Value |\\n|-------|-------|\\n| Severity | **CRITICAL** |\\n\\n- Item 1\\n- Item 2",
        result: "Renders as formatted header, table with bold text, and bullet list in Jira"
      },

      simple_text: {
        note: "Plain text without markdown syntax is wrapped in a simple paragraph",
        input: "Just plain text here",
        result: "Stored as a simple paragraph"
      },

      structured_fields: {
        note: "Use these fields in create_issue/update_issue for automatic ADF conversion",
        fields: {
          description: "Plain text - wrapped in paragraph",
          acceptance_criteria: "Array of strings - converted to H3 heading + bullet list",
          technical_tasks: "Array of strings - converted to H3 heading + bullet list"
        },
        example: {
          description: "Main description text",
          acceptance_criteria: ["Criterion 1", "Criterion 2"],
          technical_tasks: ["Task 1", "Task 2"]
        }
      },

      adf_structure: {
        basic_document: {
          type: "doc",
          version: 1,
          content: []
        },

        node_types: {
          paragraph: {
            description: "Basic text paragraph",
            example: {
              type: "paragraph",
              content: [{ type: "text", text: "Your text here" }]
            }
          },
          heading: {
            description: "Header (level 1-6)",
            example: {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Header Text" }]
            }
          },
          bulletList: {
            description: "Unordered list",
            example: {
              type: "bulletList",
              content: [{
                type: "listItem",
                content: [{
                  type: "paragraph",
                  content: [{ type: "text", text: "List item" }]
                }]
              }]
            }
          },
          orderedList: {
            description: "Numbered list",
            example: {
              type: "orderedList",
              content: [{
                type: "listItem",
                content: [{
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 1" }]
                }]
              }]
            }
          },
          codeBlock: {
            description: "Code block with language",
            example: {
              type: "codeBlock",
              attrs: { language: "javascript" },
              content: [{ type: "text", text: "const x = 1;" }]
            }
          },
          table: {
            description: "Table structure",
            example: {
              type: "table",
              content: [{
                type: "tableRow",
                content: [{
                  type: "tableHeader",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Header" }] }]
                }]
              }]
            }
          }
        },

        text_marks: {
          description: "Apply formatting to text nodes using marks array",
          marks: {
            strong: { type: "strong", effect: "Bold text" },
            em: { type: "em", effect: "Italic text" },
            underline: { type: "underline", effect: "Underlined text" },
            code: { type: "code", effect: "Inline code" },
            link: {
              type: "link",
              attrs: { href: "https://example.com" },
              effect: "Hyperlink"
            },
            textColor: {
              type: "textColor",
              attrs: { color: "#ff0000" },
              effect: "Colored text"
            }
          },
          example: {
            type: "text",
            text: "Bold and italic",
            marks: [{ type: "strong" }, { type: "em" }]
          }
        }
      },

      full_example: {
        description: "Complete ADF document with header, formatted text, and list",
        document: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "PPQA Finding: No Self-Merge" }]
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Severity: " },
                { type: "text", text: "CRITICAL", marks: [{ type: "strong" }, { type: "textColor", attrs: { color: "#ff0000" } }] }
              ]
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Details" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [{
                    type: "paragraph",
                    content: [{ type: "text", text: "All PRs must be reviewed" }]
                  }]
                },
                {
                  type: "listItem",
                  content: [{
                    type: "paragraph",
                    content: [{ type: "text", text: "Self-merge is prohibited" }]
                  }]
                }
              ]
            }
          ]
        }
      }
    },

    tools: {
      issue_management: [
        {
          name: "search_issues",
          description: "Search issues using JQL",
          parameters: {
            jql: "JQL query string (required)",
            maxResults: "Max results to return (default: 50)",
            startAt: "Pagination offset (default: 0)"
          }
        },
        {
          name: "get_issue_details",
          description: "Get full issue details",
          parameters: {
            issueKey: "Issue key like PROJ-123 (required)",
            includeComments: "Include comments (default: false)",
            includeWorklogs: "Include work logs (default: false)"
          }
        },
        {
          name: "create_issue",
          description: "Create new issue with rich text support",
          parameters: {
            projectKey: "Project key (required)",
            issueType: "Epic, Story, Task, Bug, Sub-task (required)",
            summary: "Issue title (required)",
            description: "Plain text description",
            acceptance_criteria: "Array of criteria - auto-converted to ADF list",
            technical_tasks: "Array of tasks - auto-converted to ADF list",
            priority: "Critical, High, Medium, Low",
            assignee: "Account ID",
            labels: "Array of labels",
            parentKey: "Parent issue key (for linking to Epic)"
          }
        },
        {
          name: "update_issue",
          description: "Update existing issue",
          parameters: {
            issueKey: "Issue key (required)",
            summary: "New title",
            description: "New description",
            acceptance_criteria: "Array - replaces AC section",
            technical_tasks: "Array - replaces tasks section",
            priority: "New priority",
            parentKey: "Link to Epic"
          }
        },
        {
          name: "add_comment",
          description: "Add comment to issue",
          parameters: {
            issueKey: "Issue key (required)",
            comment: "Comment text (required) - plain text only"
          }
        },
        {
          name: "transition_issue",
          description: "Move issue to new status",
          parameters: {
            issueKey: "Issue key (required)",
            transitionName: "Target status name (required)",
            comment: "Optional transition comment"
          }
        }
      ],
      board_sprint: [
        {
          name: "get_boards",
          description: "List all boards"
        },
        {
          name: "get_board_details",
          description: "Get board configuration"
        },
        {
          name: "create_sprint",
          description: "Create new sprint"
        },
        {
          name: "move_issues_to_sprint",
          description: "Add issues to sprint"
        }
      ],
      time_tracking: [
        {
          name: "add_worklog",
          description: "Log time on issue",
          parameters: {
            issueKey: "Issue key (required)",
            timeSpent: "Time like '2h 30m' (required)",
            comment: "Work description"
          }
        }
      ]
    },

    request_format: {
      protocol: "JSON-RPC 2.0",
      example: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_issue",
          arguments: {
            projectKey: "PROJ",
            issueType: "Story",
            summary: "My Story Title",
            description: "Story description",
            acceptance_criteria: ["AC 1", "AC 2"],
            technical_tasks: ["Task 1", "Task 2"]
          }
        }
      }
    },

    tips: [
      "Use acceptance_criteria and technical_tasks arrays for automatic rich text formatting",
      "Plain description strings have NO formatting - use ADF for full control",
      "Comments are plain text only - no rich text support yet",
      "Get available transitions with get_issue_details before transitioning",
      "Use parentKey in create_issue to link Story to Epic"
    ],

    links: {
      documentation: "https://jira-mcp-pi.vercel.app/api/mcp",
      project_registry: "https://project-registry-henna.vercel.app",
      adf_reference: "https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/",
      jira_api_docs: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/"
    }
  };

  return res.status(200).json(howto);
}
