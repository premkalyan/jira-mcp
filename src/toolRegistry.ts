import { JiraApiClient } from './jiraApiClient.js';
import { ToolDefinition, ToolResult } from './types/index.js';
import { Logger } from './utils/logger.js';
import { 
  BoardService,
  IssueService,
  UserService,
  ProjectService,
  WorklogService,
  ServerService,
  SprintService,
  IssueLinkService,
  BulkOperationsService
} from './services/index.js';

export class JiraToolRegistry {
  private logger: Logger;
  private boardService: BoardService;
  private issueService: IssueService;
  private userService: UserService;
  private projectService: ProjectService;
  private worklogService: WorklogService;
  private serverService: ServerService;
  private sprintService: SprintService;
  private issueLinkService: IssueLinkService;
  private bulkOperationsService: BulkOperationsService;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('JiraToolRegistry');
    
    // Initialize services
    this.boardService = new BoardService(apiClient);
    this.issueService = new IssueService(apiClient);
    this.userService = new UserService(apiClient);
    this.projectService = new ProjectService(apiClient);
    this.worklogService = new WorklogService(apiClient);
    this.serverService = new ServerService(apiClient);
    this.sprintService = new SprintService(apiClient);
    this.issueLinkService = new IssueLinkService(apiClient);
    this.bulkOperationsService = new BulkOperationsService(apiClient);
  }

  getToolDefinitions(): ToolDefinition[] {
    return [
      // Board tools
      {
        name: 'get_boards',
        description: 'List all available Jira boards with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Board type filter (scrum, kanban, simple)',
              enum: ['scrum', 'kanban', 'simple']
            },
            projectKey: {
              type: 'string',
              description: 'Filter boards by project key'
            }
          },
        },
      },
      {
        name: 'get_board_details',
        description: 'Get detailed information about the configured board. Uses boardName from Project Registry config.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured boardName if not provided)'
            }
          },
        },
      },
      {
        name: 'get_board_issues',
        description: 'Get issues from the configured board with advanced filtering. Uses boardName from Project Registry config.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured boardName if not provided)'
            },
            assigneeFilter: {
              type: 'string',
              description: 'Filter by assignee (currentUser, unassigned, or specific user)',
              enum: ['currentUser', 'unassigned', 'all']
            },
            statusFilter: {
              type: 'string',
              description: 'Filter by status category',
              enum: ['new', 'indeterminate', 'done', 'all']
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return (default: 50)',
              minimum: 1,
              maximum: 100
            }
          },
        },
      },

      // Issue tools
      {
        name: 'search_issues',
        description: 'Search for issues using JQL (Jira Query Language)',
        inputSchema: {
          type: 'object',
          properties: {
            jql: {
              type: 'string',
              description: 'JQL query string'
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              minimum: 1,
              maximum: 100
            }
          },
          required: ['jql'],
        },
      },
      {
        name: 'get_issue_details',
        description: 'Get comprehensive details about a specific issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key (e.g., PROJ-123) or ID'
            },
            includeComments: {
              type: 'boolean',
              description: 'Include comments in the response (default: false)'
            },
            includeWorklogs: {
              type: 'boolean',
              description: 'Include worklogs in the response (default: false)'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'Project key where the issue will be created (uses JIRA_PROJECT_KEY env var if not provided)'
            },
            issueType: {
              type: 'string',
              description: 'Issue type (e.g., Task, Bug, Story)'
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title'
            },
            description: {
              type: 'string',
              description: 'Issue description (user story)'
            },
            acceptance_criteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of acceptance criteria (4-7 detailed, testable conditions). Formatted as bullet list in Jira with "Acceptance Criteria" heading.'
            },
            technical_tasks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of technical implementation tasks (4-7 specific tasks). Formatted as bullet list in Jira with "Technical Tasks" heading.'
            },
            priority: {
              type: 'string',
              description: 'Issue priority (Highest, High, Medium, Low, Lowest)',
              enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest']
            },
            assignee: {
              type: 'string',
              description: 'Assignee account ID (optional)'
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Issue labels'
            }
          },
          required: ['issueType', 'summary'],
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue. Use parentKey to link a story to an epic.',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to update'
            },
            summary: {
              type: 'string',
              description: 'New summary'
            },
            description: {
              type: 'string',
              description: 'New description (user story)'
            },
            acceptance_criteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of acceptance criteria (4-7 detailed, testable conditions). Formatted as bullet list in Jira with "Acceptance Criteria" heading.'
            },
            technical_tasks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of technical implementation tasks (4-7 specific tasks). Formatted as bullet list in Jira with "Technical Tasks" heading.'
            },
            priority: {
              type: 'string',
              description: 'New priority'
            },
            assignee: {
              type: 'string',
              description: 'New assignee account ID'
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'New labels'
            },
            parentKey: {
              type: 'string',
              description: 'Epic key to link this story to (e.g., "PROJ-123"). Sets the parent field to create epic-story relationship.'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'transition_issue',
        description: 'Transition an issue to a different status',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to transition'
            },
            transitionName: {
              type: 'string',
              description: 'Name of the transition (e.g., "In Progress", "Done")'
            },
            comment: {
              type: 'string',
              description: 'Optional comment to add during transition'
            }
          },
          required: ['issueKey', 'transitionName'],
        },
      },
      {
        name: 'add_comment',
        description: 'Add a comment to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to comment on'
            },
            comment: {
              type: 'string',
              description: 'Comment text'
            }
          },
          required: ['issueKey', 'comment'],
        },
      },

      // User tools
      {
        name: 'get_current_user',
        description: 'Get information about the currently authenticated user',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_users',
        description: 'Search for users by username, email, or display name',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (username, email, or display name)'
            }
          },
          required: ['query'],
        },
      },
      {
        name: 'get_user_details',
        description: 'Get detailed information about a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'User account ID'
            }
          },
          required: ['accountId'],
        },
      },

      // Project tools
      {
        name: 'get_projects',
        description: 'List all accessible projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_details',
        description: 'Get detailed information about a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'Project key or ID'
            }
          },
          required: ['projectKey'],
        },
      },

      // Worklog tools
      {
        name: 'add_worklog',
        description: 'Add work log entry to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to log work against'
            },
            timeSpent: {
              type: 'string',
              description: 'Time spent (e.g., "2h 30m", "1d", "4h")'
            },
            comment: {
              type: 'string',
              description: 'Work description/comment'
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO format, optional - defaults to now)'
            }
          },
          required: ['issueKey', 'timeSpent'],
        },
      },
      {
        name: 'get_worklogs',
        description: 'Get work logs for an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to get worklogs for'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'update_worklog',
        description: 'Update an existing work log entry (change time, comment, or date)',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key (e.g., PROJ-123)'
            },
            worklogId: {
              type: 'string',
              description: 'ID of the worklog to update (from get_worklogs)'
            },
            timeSpent: {
              type: 'string',
              description: 'New time spent (e.g., "2h 30m", "1d")'
            },
            comment: {
              type: 'string',
              description: 'New work description/comment'
            },
            startDate: {
              type: 'string',
              description: 'New start date (ISO format)'
            }
          },
          required: ['issueKey', 'worklogId'],
        },
      },
      {
        name: 'delete_worklog',
        description: 'Delete a work log entry from an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key (e.g., PROJ-123)'
            },
            worklogId: {
              type: 'string',
              description: 'ID of the worklog to delete (from get_worklogs)'
            }
          },
          required: ['issueKey', 'worklogId'],
        },
      },
      {
        name: 'get_my_worklogs',
        description: 'Get all work logs by current user for a date range (timesheet). Use for tracking personal hours.',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD format)'
            },
            endDate: {
              type: 'string',
              description: 'End date (YYYY-MM-DD format)'
            },
            projectKey: {
              type: 'string',
              description: 'Optional: Filter by project key'
            }
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'get_sprint_worklogs',
        description: 'Get aggregate work logs for all issues in a sprint. Useful for sprint reporting and team capacity tracking.',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID (optional - uses active sprint if not provided)'
            },
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured board if not provided)'
            },
            groupBy: {
              type: 'string',
              description: 'Group results by: user, issue, or day',
              enum: ['user', 'issue', 'day']
            }
          },
        },
      },

      // Server tools
      {
        name: 'get_server_info',
        description: 'Get Jira server information and status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Sprint tools (Priority 1)
      {
        name: 'create_sprint',
        description: 'Create a new sprint on the configured board. Uses boardName from Project Registry config.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured boardName if not provided)'
            },
            sprintName: {
              type: 'string',
              description: 'Name of the sprint'
            },
            startDate: {
              type: 'string',
              description: 'Sprint start date (ISO format, optional)'
            },
            endDate: {
              type: 'string',
              description: 'Sprint end date (ISO format, optional)'
            },
            goal: {
              type: 'string',
              description: 'Sprint goal (optional)'
            }
          },
          required: ['sprintName'],
        },
      },
      {
        name: 'update_sprint',
        description: 'Update an existing sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to update'
            },
            sprintName: {
              type: 'string',
              description: 'New sprint name'
            },
            startDate: {
              type: 'string',
              description: 'New start date (ISO format)'
            },
            endDate: {
              type: 'string',
              description: 'New end date (ISO format)'
            },
            goal: {
              type: 'string',
              description: 'New sprint goal'
            },
            state: {
              type: 'string',
              description: 'Sprint state (future, active, closed)',
              enum: ['future', 'active', 'closed']
            }
          },
          required: ['sprintId'],
        },
      },
      {
        name: 'get_sprint_details',
        description: 'Get comprehensive details about a specific sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to get details for'
            }
          },
          required: ['sprintId'],
        },
      },
      {
        name: 'get_board_sprints',
        description: 'Get all sprints for the configured board. Uses boardName from Project Registry config.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured boardName if not provided)'
            },
            state: {
              type: 'string',
              description: 'Filter by sprint state (future, active, closed, all)',
              enum: ['future', 'active', 'closed', 'all']
            }
          },
        },
      },
      {
        name: 'add_issues_to_sprint',
        description: 'Add multiple issues to a sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to add issues to'
            },
            issueKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue keys to add to the sprint'
            }
          },
          required: ['sprintId', 'issueKeys'],
        },
      },
      {
        name: 'remove_issues_from_sprint',
        description: 'Remove multiple issues from a sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to remove issues from'
            },
            issueKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue keys to remove from the sprint'
            }
          },
          required: ['sprintId', 'issueKeys'],
        },
      },
      {
        name: 'move_issues_between_sprints',
        description: 'Move issues from one sprint to another',
        inputSchema: {
          type: 'object',
          properties: {
            fromSprintId: {
              type: 'string',
              description: 'Source sprint ID'
            },
            toSprintId: {
              type: 'string',
              description: 'Target sprint ID'
            },
            issueKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue keys to move'
            }
          },
          required: ['fromSprintId', 'toSprintId', 'issueKeys'],
        },
      },
      {
        name: 'start_sprint',
        description: 'Start a sprint (activate it)',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to start'
            },
            startDate: {
              type: 'string',
              description: 'Actual start date (ISO format, optional)'
            },
            endDate: {
              type: 'string',
              description: 'Actual end date (ISO format, optional)'
            }
          },
          required: ['sprintId'],
        },
      },
      {
        name: 'complete_sprint',
        description: 'Complete/close a sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to complete'
            },
            incompleteIssuesAction: {
              type: 'string',
              description: 'Action for incomplete issues (move_to_backlog, move_to_next_sprint)',
              enum: ['move_to_backlog', 'move_to_next_sprint']
            }
          },
          required: ['sprintId'],
        },
      },
      {
        name: 'get_active_sprint',
        description: 'Get the currently active sprint for the configured board. Uses boardName from Project Registry config.',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'Board ID (optional - uses configured boardName if not provided)'
            }
          },
        },
      },
      {
        name: 'get_sprint_capacity',
        description: 'Get sprint capacity analysis with story points and progress',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to analyze capacity for'
            }
          },
          required: ['sprintId'],
        },
      },
      {
        name: 'set_sprint_goal',
        description: 'Set or update the goal for a sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprintId: {
              type: 'string',
              description: 'Sprint ID to set goal for'
            },
            goal: {
              type: 'string',
              description: 'Sprint goal text'
            }
          },
          required: ['sprintId', 'goal'],
        },
      },

      // Story Points tools (Priority 3 - Critical)
      {
        name: 'set_story_points',
        description: 'Set story points for an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to set story points for'
            },
            storyPoints: {
              type: 'number',
              description: 'Story points value (typically 1, 2, 3, 5, 8, 13, etc.)'
            }
          },
          required: ['issueKey', 'storyPoints'],
        },
      },
      {
        name: 'get_story_points',
        description: 'Get story points for an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to get story points for'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'bulk_update_story_points',
        description: 'Update story points for multiple issues at once',
        inputSchema: {
          type: 'object',
          properties: {
            updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issueKey: { type: 'string' },
                  storyPoints: { type: 'number' }
                },
                required: ['issueKey', 'storyPoints']
              },
              description: 'Array of issue key and story points pairs'
            }
          },
          required: ['updates'],
        },
      },

      // Issue Linking tools (Priority 2 - Critical)
      {
        name: 'link_issues',
        description: 'Create a link between two issues (blocks, depends on, relates to)',
        inputSchema: {
          type: 'object',
          properties: {
            fromIssueKey: {
              type: 'string',
              description: 'Source issue key'
            },
            toIssueKey: {
              type: 'string',
              description: 'Target issue key'
            },
            linkType: {
              type: 'string',
              description: 'Link type (Blocks, Clones, Duplicate, Relates)',
              enum: ['Blocks', 'Clones', 'Duplicate', 'Relates']
            }
          },
          required: ['fromIssueKey', 'toIssueKey', 'linkType'],
        },
      },
      {
        name: 'get_issue_links',
        description: 'Get all links for an issue with dependency analysis',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Issue key to get links for'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'get_dependency_tree',
        description: 'Get dependency tree showing blockers and dependent issues',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'Root issue key for dependency analysis'
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum depth for dependency traversal (default: 3)'
            }
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'get_link_types',
        description: 'Get available issue link types for the Jira instance',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Subtask tools (Priority 2)
      {
        name: 'create_subtask',
        description: 'Create a subtask under a parent issue',
        inputSchema: {
          type: 'object',
          properties: {
            parentIssueKey: {
              type: 'string',
              description: 'Parent issue key'
            },
            summary: {
              type: 'string',
              description: 'Subtask summary'
            },
            description: {
              type: 'string',
              description: 'Subtask description (optional)'
            },
            assignee: {
              type: 'string',
              description: 'Assignee account ID (optional)'
            },
            priority: {
              type: 'string',
              description: 'Subtask priority (optional)'
            }
          },
          required: ['parentIssueKey', 'summary'],
        },
      },
      {
        name: 'get_subtasks',
        description: 'Get all subtasks for a parent issue',
        inputSchema: {
          type: 'object',
          properties: {
            parentIssueKey: {
              type: 'string',
              description: 'Parent issue key'
            }
          },
          required: ['parentIssueKey'],
        },
      },

      // Bulk Operations tools (Priority 5 - Critical)
      {
        name: 'bulk_create_issues',
        description: 'Create multiple issues at once for efficient project setup',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'Project key where issues will be created (uses JIRA_PROJECT_KEY env var if not provided)'
            },
            issuesData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  description: { type: 'string' },
                  issueType: { type: 'string' },
                  priority: { type: 'string' },
                  assignee: { type: 'string' },
                  labels: { type: 'array', items: { type: 'string' } },
                  storyPoints: { type: 'number' }
                },
                required: ['summary', 'issueType']
              },
              description: 'Array of issue data objects'
            }
          },
          required: ['issuesData'],
        },
      },
      {
        name: 'bulk_update_issues',
        description: 'Update multiple issues with new field values',
        inputSchema: {
          type: 'object',
          properties: {
            updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issueKey: { type: 'string' },
                  summary: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string' },
                  assignee: { type: 'string' },
                  labels: { type: 'array', items: { type: 'string' } },
                  storyPoints: { type: 'number' }
                },
                required: ['issueKey']
              },
              description: 'Array of issue updates'
            }
          },
          required: ['updates'],
        },
      },
      {
        name: 'bulk_transition_issues',
        description: 'Transition multiple issues to the same status',
        inputSchema: {
          type: 'object',
          properties: {
            issueKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue keys to transition'
            },
            transitionName: {
              type: 'string',
              description: 'Name of the transition (e.g., "In Progress", "Done")'
            },
            comment: {
              type: 'string',
              description: 'Optional comment to add during transition'
            }
          },
          required: ['issueKeys', 'transitionName'],
        },
      },
      {
        name: 'bulk_assign_issues',
        description: 'Assign multiple issues to the same person',
        inputSchema: {
          type: 'object',
          properties: {
            issueKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue keys to assign'
            },
            assignee: {
              type: 'string',
              description: 'Assignee account ID'
            }
          },
          required: ['issueKeys', 'assignee'],
        },
      },
    ];
  }

  /**
   * Helper method to resolve board ID from args or configured board name
   * If no boardName is configured, fetches the default board for the project
   */
  private async resolveBoardId(args: Record<string, any>): Promise<string> {
    // If boardId is explicitly provided, use it
    if (args.boardId) {
      return args.boardId as string;
    }

    // Otherwise, resolve from configured board name or get default board
    const boardName = this.apiClient.getBoardName();
    if (boardName) {
      this.logger.debug(`Resolving board name "${boardName}" to board ID`);
    } else {
      this.logger.debug('No boardName configured, will fetch default board for project');
    }

    const boardId = await this.apiClient.resolveBoardId();
    this.logger.info(`Using board ID: ${boardId}`);
    return boardId;
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    this.logger.debug(`Executing tool: ${toolName}`, args);

    try {
      switch (toolName) {
        // Board tools
        case 'get_boards':
          return await this.boardService.getBoards(args);
        case 'get_board_details': {
          const boardId = await this.resolveBoardId(args);
          return await this.boardService.getBoardDetails(boardId);
        }
        case 'get_board_issues': {
          const boardId = await this.resolveBoardId(args);
          return await this.boardService.getBoardIssues({
            boardId: boardId,
            assigneeFilter: args.assigneeFilter as 'currentUser' | 'unassigned' | 'all',
            statusFilter: args.statusFilter as 'new' | 'indeterminate' | 'done' | 'all',
            maxResults: args.maxResults as number,
          });
        }

        // Issue tools
        case 'search_issues':
          return await this.issueService.searchIssues({
            jql: args.jql as string,
            maxResults: args.maxResults as number,
            startAt: args.startAt as number,
            fields: args.fields as string[],
            expand: args.expand as string[],
          });
        case 'get_issue_details':
          return await this.issueService.getIssueDetails({
            issueKey: args.issueKey as string,
            includeComments: args.includeComments as boolean,
            includeWorklogs: args.includeWorklogs as boolean,
          });
        case 'create_issue':
          return await this.issueService.createIssue({
            projectKey: (args.projectKey as string) || process.env.JIRA_PROJECT_KEY || '',
            issueType: args.issueType as string,
            summary: args.summary as string,
            description: args.description as string,
            acceptance_criteria: args.acceptance_criteria as string[],
            technical_tasks: args.technical_tasks as string[],
            priority: args.priority as string,
            assignee: args.assignee as string,
            labels: args.labels as string[],
            components: args.components as string[],
            fixVersions: args.fixVersions as string[],
            dueDate: args.dueDate as string,
            parentKey: args.parentKey as string,
          });
        case 'update_issue':
          return await this.issueService.updateIssue({
            issueKey: args.issueKey as string,
            summary: args.summary as string,
            description: args.description as string,
            acceptance_criteria: args.acceptance_criteria as string[],
            technical_tasks: args.technical_tasks as string[],
            priority: args.priority as string,
            assignee: args.assignee as string,
            labels: args.labels as string[],
            components: args.components as string[],
            fixVersions: args.fixVersions as string[],
            dueDate: args.dueDate as string,
            parentKey: args.parentKey as string,
          });
        case 'transition_issue':
          return await this.issueService.transitionIssue({
            issueKey: args.issueKey as string,
            transitionName: args.transitionName as string,
            comment: args.comment as string,
          });
        case 'add_comment':
          return await this.issueService.addComment({
            issueKey: args.issueKey as string,
            comment: args.comment as string,
          });

        // User tools
        case 'get_current_user':
          return await this.userService.getCurrentUser();
        case 'search_users':
          return await this.userService.searchUsers(args.query as string);
        case 'get_user_details':
          return await this.userService.getUserDetails(args.accountId as string);

        // Project tools
        case 'get_projects':
          return await this.projectService.getProjects();
        case 'get_project_details':
          return await this.projectService.getProjectDetails(args.projectKey as string);

        // Worklog tools
        case 'add_worklog':
          return await this.worklogService.addWorklog({
            issueKey: args.issueKey as string,
            timeSpent: args.timeSpent as string,
            comment: args.comment as string,
            startDate: args.startDate as string,
          });
        case 'get_worklogs':
          return await this.worklogService.getWorklogs(args.issueKey as string);
        case 'update_worklog':
          return await this.worklogService.updateWorklog({
            issueKey: args.issueKey as string,
            worklogId: args.worklogId as string,
            timeSpent: args.timeSpent as string,
            comment: args.comment as string,
            startDate: args.startDate as string,
          });
        case 'delete_worklog':
          return await this.worklogService.deleteWorklog({
            issueKey: args.issueKey as string,
            worklogId: args.worklogId as string,
          });
        case 'get_my_worklogs':
          return await this.worklogService.getMyWorklogs({
            startDate: args.startDate as string,
            endDate: args.endDate as string,
            projectKey: args.projectKey as string,
          });
        case 'get_sprint_worklogs':
          return await this.worklogService.getSprintWorklogs({
            sprintId: args.sprintId as string,
            boardId: args.boardId as string,
            groupBy: args.groupBy as 'user' | 'issue' | 'day',
          });

        // Server tools
        case 'get_server_info':
          return await this.serverService.getServerInfo();

        // Sprint tools (Priority 1)
        case 'create_sprint': {
          const boardId = await this.resolveBoardId(args);
          return await this.sprintService.createSprint({
            boardId: boardId,
            sprintName: args.sprintName as string,
            startDate: args.startDate as string,
            endDate: args.endDate as string,
            goal: args.goal as string,
          });
        }
        case 'update_sprint':
          return await this.sprintService.updateSprint({
            sprintId: args.sprintId as string,
            sprintName: args.sprintName as string,
            startDate: args.startDate as string,
            endDate: args.endDate as string,
            goal: args.goal as string,
            state: args.state as string,
          });
        case 'get_sprint_details':
          return await this.sprintService.getSprintDetails(args.sprintId as string);
        case 'get_board_sprints': {
          const boardId = await this.resolveBoardId(args);
          return await this.sprintService.getBoardSprints(boardId, args.state as string);
        }
        case 'add_issues_to_sprint':
          return await this.sprintService.addIssuesToSprint({
            sprintId: args.sprintId as string,
            issueKeys: args.issueKeys as string[],
          });
        case 'remove_issues_from_sprint':
          return await this.sprintService.removeIssuesFromSprint({
            sprintId: args.sprintId as string,
            issueKeys: args.issueKeys as string[],
          });
        case 'move_issues_between_sprints':
          return await this.sprintService.moveIssuesBetweenSprints({
            fromSprintId: args.fromSprintId as string,
            toSprintId: args.toSprintId as string,
            issueKeys: args.issueKeys as string[],
          });
        case 'start_sprint':
          return await this.sprintService.startSprint(
            args.sprintId as string,
            args.startDate as string,
            args.endDate as string
          );
        case 'complete_sprint':
          return await this.sprintService.completeSprint(
            args.sprintId as string,
            args.incompleteIssuesAction as string
          );
        case 'get_active_sprint': {
          const boardId = await this.resolveBoardId(args);
          return await this.sprintService.getActiveSprint(boardId);
        }
        case 'get_sprint_capacity':
          return await this.sprintService.getSprintCapacity(args.sprintId as string);
        case 'set_sprint_goal':
          return await this.sprintService.setSprintGoal(args.sprintId as string, args.goal as string);

        // Story Points tools (Priority 3 - Critical)
        case 'set_story_points':
          return await this.issueService.setStoryPoints(args.issueKey as string, args.storyPoints as number);
        case 'get_story_points':
          return await this.issueService.getStoryPoints(args.issueKey as string);
        case 'bulk_update_story_points':
          return await this.issueService.bulkUpdateStoryPoints(args.updates as Array<{ issueKey: string; storyPoints: number }>);

        // Issue Linking tools (Priority 2 - Critical)
        case 'link_issues':
          return await this.issueLinkService.linkIssues({
            fromIssueKey: args.fromIssueKey as string,
            toIssueKey: args.toIssueKey as string,
            linkType: args.linkType as string,
          });
        case 'get_issue_links':
          return await this.issueLinkService.getIssueLinks(args.issueKey as string);
        case 'get_dependency_tree':
          return await this.issueLinkService.getDependencyTree(args.issueKey as string, args.maxDepth as number);
        case 'get_link_types':
          return await this.issueLinkService.getLinkTypes();

        // Subtask tools (Priority 2)
        case 'create_subtask':
          return await this.issueService.createSubtask(args.parentIssueKey as string, {
            summary: args.summary as string,
            description: args.description as string,
            assignee: args.assignee as string,
            priority: args.priority as string,
          });
        case 'get_subtasks':
          return await this.issueService.getSubtasks(args.parentIssueKey as string);

        // Bulk Operations tools (Priority 5 - Critical)
        case 'bulk_create_issues':
          return await this.bulkOperationsService.bulkCreateIssues({
            projectKey: (args.projectKey as string) || process.env.JIRA_PROJECT_KEY || '',
            issuesData: args.issuesData as Array<{
              summary: string;
              description?: string;
              issueType: string;
              priority?: string;
              assignee?: string;
              labels?: string[];
              storyPoints?: number;
            }>,
          });
        case 'bulk_update_issues':
          return await this.bulkOperationsService.bulkUpdateIssues({
            updates: args.updates as Array<{
              issueKey: string;
              summary?: string;
              description?: string;
              priority?: string;
              assignee?: string;
              labels?: string[];
              storyPoints?: number;
            }>,
          });
        case 'bulk_transition_issues':
          return await this.bulkOperationsService.bulkTransitionIssues({
            issueKeys: args.issueKeys as string[],
            transitionName: args.transitionName as string,
            comment: args.comment as string,
          });
        case 'bulk_assign_issues':
          return await this.bulkOperationsService.bulkAssignIssues(
            args.issueKeys as string[],
            args.assignee as string
          );

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      this.logger.error(`Tool execution failed for ${toolName}:`, error);
      throw error;
    }
  }
}