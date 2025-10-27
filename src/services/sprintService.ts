import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, ApiResponse } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export interface CreateSprintParams {
  boardId: string;
  sprintName: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface UpdateSprintParams {
  sprintId: string;
  sprintName?: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  state?: string;
}

export interface SprintIssueOperationParams {
  sprintId: string;
  issueKeys: string[];
}

export interface MoveIssuesBetweenSprintsParams {
  fromSprintId: string;
  toSprintId: string;
  issueKeys: string[];
}

export class SprintService {
  private logger: Logger;
  private storyPointsField: string;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('SprintService');
    this.storyPointsField = process.env.JIRA_STORY_POINTS_FIELD || 'customfield_10016';
  }

  // 1. Create Sprint
  async createSprint(params: CreateSprintParams): Promise<ToolResult> {
    try {
      this.logger.debug('Creating sprint', params);

      // Validate dates if provided
      if (params.startDate && params.endDate) {
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        if (start >= end) {
          throw new Error('Start date must be before end date');
        }
      }

      const sprintData = {
        name: params.sprintName,
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.goal && { goal: params.goal }),
      };

      const sprint = await this.apiClient.createSprint(params.boardId, sprintData);

      return {
        content: [
          {
            type: 'text',
            text: `# 🚀 Sprint Created Successfully

## Sprint Details
- **ID**: ${sprint.id}
- **Name**: ${sprint.name}
- **State**: ${sprint.state}
- **Board ID**: ${params.boardId}
${params.startDate ? `- **Start Date**: ${params.startDate}` : ''}
${params.endDate ? `- **End Date**: ${params.endDate}` : ''}
${params.goal ? `- **Goal**: ${params.goal}` : ''}

## Next Steps
- Add issues to sprint: Use \`add_issues_to_sprint\` with sprintId: ${sprint.id}
- Start sprint: Use \`start_sprint\` with sprintId: ${sprint.id}
- View sprint details: Use \`get_sprint_details\` with sprintId: ${sprint.id}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to create sprint:', error);
      throw new Error(`Failed to create sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 2. Update Sprint
  async updateSprint(params: UpdateSprintParams): Promise<ToolResult> {
    try {
      this.logger.debug('Updating sprint', params);

      const sprintData = {
        ...(params.sprintName && { name: params.sprintName }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.goal && { goal: params.goal }),
        ...(params.state && { state: params.state }),
      };

      const sprint = await this.apiClient.updateSprint(params.sprintId, sprintData);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Sprint Updated Successfully

## Updated Sprint Details
- **ID**: ${sprint.id}
- **Name**: ${sprint.name}
- **State**: ${sprint.state}
${sprint.startDate ? `- **Start Date**: ${sprint.startDate}` : ''}
${sprint.endDate ? `- **End Date**: ${sprint.endDate}` : ''}
${sprint.goal ? `- **Goal**: ${sprint.goal}` : ''}

## Changes Applied
${Object.keys(sprintData).map(key => `- Updated **${key}**: ${sprintData[key as keyof typeof sprintData]}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to update sprint:', error);
      throw new Error(`Failed to update sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 3. Get Sprint Details
  async getSprintDetails(sprintId: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching sprint details for ID: ${sprintId}`);

      const sprint = await this.apiClient.getSprint(sprintId);

      // Get sprint issues for additional context
      const sprintIssues = await this.apiClient.getSprintIssues(sprintId, {
        fields: ['summary', 'status', 'assignee', 'issuetype', 'storypoints']
      });

      const issues = sprintIssues.issues || [];
      const completedIssues = issues.filter(issue => 
        issue.fields.status.statusCategory.key === 'done'
      );

      const tableData = issues.slice(0, 10).map(issue => [
        issue.key,
        issue.fields.summary.length > 40 
          ? issue.fields.summary.substring(0, 37) + '...'
          : issue.fields.summary,
        issue.fields.status.name,
        issue.fields.assignee?.displayName || 'Unassigned',
        issue.fields.issuetype.name,
      ]);

      const markdownTable = issues.length > 0 
        ? formatMarkdownTable(
            ['Key', 'Summary', 'Status', 'Assignee', 'Type'],
            tableData
          )
        : 'No issues in this sprint';

      return {
        content: [
          {
            type: 'text',
            text: `# 📊 Sprint Details: ${sprint.name}

## Basic Information
- **ID**: ${sprint.id}
- **Name**: ${sprint.name}
- **State**: ${sprint.state}
- **Board ID**: ${sprint.originBoardId}
${sprint.startDate ? `- **Start Date**: ${new Date(sprint.startDate).toLocaleDateString()}` : ''}
${sprint.endDate ? `- **End Date**: ${new Date(sprint.endDate).toLocaleDateString()}` : ''}
${sprint.goal ? `- **Goal**: ${sprint.goal}` : ''}

## Sprint Progress
- **Total Issues**: ${issues.length}
- **Completed Issues**: ${completedIssues.length}
- **Completion Rate**: ${issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0}%

## Sprint Issues ${issues.length > 10 ? '(Showing first 10)' : ''}
${markdownTable}

## Available Actions
- **Add Issues**: Use \`add_issues_to_sprint\` with sprintId: ${sprint.id}
- **Remove Issues**: Use \`remove_issues_from_sprint\` with sprintId: ${sprint.id}
${sprint.state === 'future' ? `- **Start Sprint**: Use \`start_sprint\` with sprintId: ${sprint.id}` : ''}
${sprint.state === 'active' ? `- **Complete Sprint**: Use \`complete_sprint\` with sprintId: ${sprint.id}` : ''}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get sprint details for ${sprintId}:`, error);
      throw new Error(`Failed to retrieve sprint details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 4. Get Board Sprints
  async getBoardSprints(boardId: string, state?: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching sprints for board ${boardId}`, { state });

      const response = await this.apiClient.getBoardSprints(boardId, state);
      const sprints = response.values || [];

      const tableData = sprints.map(sprint => [
        sprint.id.toString(),
        sprint.name,
        sprint.state,
        sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Not set',
        sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'Not set',
        sprint.goal || 'No goal set',
      ]);

      const markdownTable = sprints.length > 0 
        ? formatMarkdownTable(
            ['ID', 'Name', 'State', 'Start Date', 'End Date', 'Goal'],
            tableData
          )
        : 'No sprints found for this board';

      const sprintCounts = sprints.reduce((acc, sprint) => {
        acc[sprint.state] = (acc[sprint.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        content: [
          {
            type: 'text',
            text: `# 🏃‍♂️ Sprints for Board ${boardId}

${state ? `**Filter Applied**: ${state} sprints only\n` : ''}

${markdownTable}

## Summary
- **Total Sprints**: ${sprints.length}
${Object.entries(sprintCounts).map(([state, count]) => `- **${state.charAt(0).toUpperCase() + state.slice(1)}**: ${count}`).join('\n')}

## Available Actions
- **Create New Sprint**: Use \`create_sprint\` with boardId: ${boardId}
- **View Sprint Details**: Use \`get_sprint_details\` with any sprint ID above
- **Get Active Sprint**: Use \`get_active_sprint\` with boardId: ${boardId}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get board sprints for ${boardId}:`, error);
      throw new Error(`Failed to retrieve board sprints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 5. Add Issues to Sprint
  async addIssuesToSprint(params: SprintIssueOperationParams): Promise<ToolResult> {
    try {
      this.logger.debug('Adding issues to sprint', params);

      await this.apiClient.moveIssuesToSprint(params.sprintId, params.issueKeys);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issues Added to Sprint Successfully

## Operation Details
- **Sprint ID**: ${params.sprintId}
- **Issues Added**: ${params.issueKeys.length}
- **Issue Keys**: ${params.issueKeys.join(', ')}

## Next Steps
- **View Sprint**: Use \`get_sprint_details\` with sprintId: ${params.sprintId}
- **Start Sprint**: Use \`start_sprint\` if ready to begin
- **Add More Issues**: Use \`add_issues_to_sprint\` with additional issue keys`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to add issues to sprint:', error);
      throw new Error(`Failed to add issues to sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 6. Remove Issues from Sprint
  async removeIssuesFromSprint(params: SprintIssueOperationParams): Promise<ToolResult> {
    try {
      this.logger.debug('Removing issues from sprint', params);

      await this.apiClient.removeIssuesFromSprint(params.sprintId, params.issueKeys);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issues Removed from Sprint Successfully

## Operation Details
- **Sprint ID**: ${params.sprintId}
- **Issues Removed**: ${params.issueKeys.length}
- **Issue Keys**: ${params.issueKeys.join(', ')}

## Next Steps
- **View Sprint**: Use \`get_sprint_details\` with sprintId: ${params.sprintId}
- **Move to Another Sprint**: Use \`move_issues_between_sprints\`
- **Add Back to Backlog**: Issues are now available in the backlog`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to remove issues from sprint:', error);
      throw new Error(`Failed to remove issues from sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 7. Move Issues Between Sprints
  async moveIssuesBetweenSprints(params: MoveIssuesBetweenSprintsParams): Promise<ToolResult> {
    try {
      this.logger.debug('Moving issues between sprints', params);

      // Remove from source sprint
      await this.apiClient.removeIssuesFromSprint(params.fromSprintId, params.issueKeys);
      
      // Add to target sprint
      await this.apiClient.moveIssuesToSprint(params.toSprintId, params.issueKeys);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issues Moved Between Sprints Successfully

## Operation Details
- **From Sprint ID**: ${params.fromSprintId}
- **To Sprint ID**: ${params.toSprintId}
- **Issues Moved**: ${params.issueKeys.length}
- **Issue Keys**: ${params.issueKeys.join(', ')}

## Next Steps
- **View Source Sprint**: Use \`get_sprint_details\` with sprintId: ${params.fromSprintId}
- **View Target Sprint**: Use \`get_sprint_details\` with sprintId: ${params.toSprintId}
- **Update Sprint Planning**: Consider adjusting sprint capacity and goals`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to move issues between sprints:', error);
      throw new Error(`Failed to move issues between sprints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 8. Start Sprint
  async startSprint(sprintId: string, startDate?: string, endDate?: string): Promise<ToolResult> {
    try {
      this.logger.debug('Starting sprint', { sprintId, startDate, endDate });

      const sprint = await this.apiClient.startSprint(sprintId, startDate, endDate);

      return {
        content: [
          {
            type: 'text',
            text: `# 🚀 Sprint Started Successfully

## Sprint Details
- **ID**: ${sprint.id}
- **Name**: ${sprint.name}
- **State**: ${sprint.state}
- **Start Date**: ${sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Not set'}
- **End Date**: ${sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'Not set'}
${sprint.goal ? `- **Goal**: ${sprint.goal}` : ''}

## What Happens Next
- Daily standups should begin
- Team works on sprint backlog items
- Track progress with \`get_sprint_details\`
- Monitor burndown and velocity

## Available Actions
- **View Sprint Progress**: Use \`get_sprint_details\` with sprintId: ${sprint.id}
- **Get Sprint Capacity**: Use \`get_sprint_capacity\` with sprintId: ${sprint.id}
- **Complete Sprint**: Use \`complete_sprint\` when done`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to start sprint:', error);
      throw new Error(`Failed to start sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 9. Complete Sprint
  async completeSprint(sprintId: string, incompleteIssuesAction?: string): Promise<ToolResult> {
    try {
      this.logger.debug('Completing sprint', { sprintId, incompleteIssuesAction });

      // Get sprint details before completion for reporting
      const sprintBefore = await this.apiClient.getSprint(sprintId);
      const sprintIssues = await this.apiClient.getSprintIssues(sprintId, {
        fields: ['summary', 'status', 'assignee', 'issuetype', 'storypoints']
      });

      const issues = sprintIssues.issues || [];
      const completedIssues = issues.filter(issue => 
        issue.fields.status.statusCategory.key === 'done'
      );
      const incompleteIssues = issues.filter(issue => 
        issue.fields.status.statusCategory.key !== 'done'
      );

      // Complete the sprint
      const sprint = await this.apiClient.completeSprint(sprintId, incompleteIssuesAction);

      return {
        content: [
          {
            type: 'text',
            text: `# 🏁 Sprint Completed Successfully

## Sprint Summary
- **ID**: ${sprint.id}
- **Name**: ${sprintBefore.name}
- **State**: ${sprint.state}
- **Duration**: ${sprintBefore.startDate && sprintBefore.endDate 
  ? `${Math.ceil((new Date(sprintBefore.endDate).getTime() - new Date(sprintBefore.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
  : 'Duration not set'}

## Sprint Results
- **Total Issues**: ${issues.length}
- **Completed Issues**: ${completedIssues.length}
- **Incomplete Issues**: ${incompleteIssues.length}
- **Completion Rate**: ${issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0}%

## Incomplete Issues
${incompleteIssues.length > 0 
  ? incompleteIssues.slice(0, 5).map(issue => `- ${issue.key}: ${issue.fields.summary}`).join('\n')
  : 'All issues completed! 🎉'}

${incompleteIssuesAction ? `\n**Action Taken**: ${incompleteIssuesAction}` : ''}

## Retrospective Notes
- Consider what went well and what could be improved
- Review velocity for future sprint planning
- Update team capacity estimates if needed

## Next Steps
- **Plan Next Sprint**: Use \`create_sprint\` for the next iteration
- **Review Sprint Report**: Use \`get_sprint_report\` (when available)
- **Update Board**: Use \`get_board_sprints\` to see updated sprint list`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to complete sprint:', error);
      throw new Error(`Failed to complete sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 10. Get Active Sprint
  async getActiveSprint(boardId: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Getting active sprint for board ${boardId}`);

      const activeSprint = await this.apiClient.getActiveSprint(boardId);

      if (!activeSprint) {
        return {
          content: [
            {
              type: 'text',
              text: `# 📋 No Active Sprint Found

## Board ${boardId}
- **Status**: No active sprint currently running
- **Available Actions**:
  - **View All Sprints**: Use \`get_board_sprints\` with boardId: ${boardId}
  - **Create New Sprint**: Use \`create_sprint\` with boardId: ${boardId}
  - **Start Existing Sprint**: Use \`start_sprint\` with an existing future sprint`,
            },
          ],
        };
      }

      // Get sprint issues for additional context
      const sprintIssues = await this.apiClient.getSprintIssues(activeSprint.id, {
        fields: ['summary', 'status', 'assignee', 'issuetype']
      });

      const issues = sprintIssues.issues || [];
      const completedIssues = issues.filter(issue => 
        issue.fields.status.statusCategory.key === 'done'
      );

      return {
        content: [
          {
            type: 'text',
            text: `# 🏃‍♂️ Active Sprint: ${activeSprint.name}

## Sprint Details
- **ID**: ${activeSprint.id}
- **Name**: ${activeSprint.name}
- **State**: ${activeSprint.state}
- **Board ID**: ${boardId}
${activeSprint.startDate ? `- **Start Date**: ${new Date(activeSprint.startDate).toLocaleDateString()}` : ''}
${activeSprint.endDate ? `- **End Date**: ${new Date(activeSprint.endDate).toLocaleDateString()}` : ''}
${activeSprint.goal ? `- **Goal**: ${activeSprint.goal}` : ''}

## Progress Overview
- **Total Issues**: ${issues.length}
- **Completed Issues**: ${completedIssues.length}
- **Remaining Issues**: ${issues.length - completedIssues.length}
- **Progress**: ${issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0}%

## Available Actions
- **View Full Sprint Details**: Use \`get_sprint_details\` with sprintId: ${activeSprint.id}
- **Add Issues**: Use \`add_issues_to_sprint\` with sprintId: ${activeSprint.id}
- **Remove Issues**: Use \`remove_issues_from_sprint\` with sprintId: ${activeSprint.id}
- **Complete Sprint**: Use \`complete_sprint\` with sprintId: ${activeSprint.id}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get active sprint for board ${boardId}:`, error);
      throw new Error(`Failed to get active sprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 11. Get Sprint Capacity
  async getSprintCapacity(sprintId: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Getting sprint capacity for ${sprintId}`);

      const sprint = await this.apiClient.getSprint(sprintId);
      const sprintIssues = await this.apiClient.getSprintIssues(sprintId, {
        fields: ['summary', 'status', 'assignee', 'issuetype', this.storyPointsField],
      });

      const issues = sprintIssues.issues || [];
      const completedIssues = issues.filter(issue =>
        issue.fields.status.statusCategory.key === 'done'
      );

      // Calculate story points (this field may vary based on Jira configuration)
      const getStoryPoints = (issue: any) => {
        return issue.fields[this.storyPointsField] || 0;
      };

      const totalStoryPoints = issues.reduce((sum, issue) => sum + getStoryPoints(issue), 0);
      const completedStoryPoints = completedIssues.reduce((sum, issue) => sum + getStoryPoints(issue), 0);

      // Group by assignee for capacity analysis
      const assigneeCapacity = issues.reduce((acc, issue) => {
        const assignee = issue.fields.assignee?.displayName || 'Unassigned';
        if (!acc[assignee]) {
          acc[assignee] = { total: 0, completed: 0, issues: 0, completedIssues: 0 };
        }
        acc[assignee].total += getStoryPoints(issue);
        acc[assignee].issues += 1;
        
        if (issue.fields.status.statusCategory.key === 'done') {
          acc[assignee].completed += getStoryPoints(issue);
          acc[assignee].completedIssues += 1;
        }
        return acc;
      }, {} as Record<string, any>);

      const capacityTable = Object.entries(assigneeCapacity).map(([assignee, data]) => {
        const capacity = data as { total: number; completed: number; issues: number; completedIssues: number };
        return [
          assignee,
          capacity.issues.toString(),
          capacity.completedIssues.toString(),
          capacity.total.toString(),
          capacity.completed.toString(),
          capacity.total > 0 ? `${Math.round((capacity.completed / capacity.total) * 100)}%` : '0%',
        ];
      });

      const markdownTable = Object.keys(assigneeCapacity).length > 0 
        ? formatMarkdownTable(
            ['Assignee', 'Total Issues', 'Completed', 'Total Points', 'Completed Points', 'Progress'],
            capacityTable
          )
        : 'No assignee data available';

      return {
        content: [
          {
            type: 'text',
            text: `# 📊 Sprint Capacity Analysis: ${sprint.name}

## Overall Capacity
- **Sprint ID**: ${sprint.id}
- **Total Story Points**: ${totalStoryPoints}
- **Completed Story Points**: ${completedStoryPoints}
- **Remaining Story Points**: ${totalStoryPoints - completedStoryPoints}
- **Overall Progress**: ${totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0}%

## Team Capacity Breakdown
${markdownTable}

## Capacity Insights
- **Total Team Members**: ${Object.keys(assigneeCapacity).length}
- **Average Points per Person**: ${Object.keys(assigneeCapacity).length > 0 ? Math.round(totalStoryPoints / Object.keys(assigneeCapacity).length) : 0}
- **Velocity Projection**: Based on current progress
${totalStoryPoints > 0 && completedStoryPoints > 0 
  ? `- **Estimated Completion**: ${Math.round((totalStoryPoints / completedStoryPoints) * 100)}% of sprint duration needed`
  : ''}

## Recommendations
${completedStoryPoints / totalStoryPoints < 0.3 && sprint.state === 'active' 
  ? '⚠️ **Low Progress**: Consider daily standups to identify blockers'
  : completedStoryPoints / totalStoryPoints > 0.8 
    ? '✅ **Great Progress**: On track to complete sprint goals'
    : '📈 **Good Progress**: Continue current pace'}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get sprint capacity for ${sprintId}:`, error);
      throw new Error(`Failed to get sprint capacity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 12. Set Sprint Goal
  async setSprintGoal(sprintId: string, goal: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Setting sprint goal for ${sprintId}`, { goal });

      const sprint = await this.apiClient.updateSprint(sprintId, { goal });

      return {
        content: [
          {
            type: 'text',
            text: `# 🎯 Sprint Goal Updated Successfully

## Sprint Details
- **ID**: ${sprint.id}
- **Name**: ${sprint.name}
- **State**: ${sprint.state}
- **New Goal**: ${goal}

## Goal Setting Best Practices ✅
- Goals should be specific and measurable
- Align with product objectives
- Be achievable within sprint timeframe
- Provide clear value to users/stakeholders

## Next Steps
- **Communicate Goal**: Share with the development team
- **Align Work**: Ensure all sprint items support this goal
- **Track Progress**: Use \`get_sprint_details\` to monitor goal achievement
- **Review in Retrospective**: Evaluate goal achievement at sprint end`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to set sprint goal for ${sprintId}:`, error);
      throw new Error(`Failed to set sprint goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
