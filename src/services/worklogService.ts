import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, WorklogRequest } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export class WorklogService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('WorklogService');
  }

  async addWorklog(params: WorklogRequest): Promise<ToolResult> {
    try {
      this.logger.debug(`Adding worklog to issue: ${params.issueKey}`, params);

      const result = await this.apiClient.addWorklog(
        params.issueKey,
        params.timeSpent,
        params.comment,
        params.startDate
      );

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Work Log Added Successfully!

**Issue**: ${params.issueKey}
**Time Spent**: ${params.timeSpent}
**Work Log ID**: ${result.id}
**Started**: ${new Date(result.started).toLocaleString()}
${params.comment ? `**Comment**: ${params.comment}` : ''}

## Work Details
- **Author**: ${result.author.displayName}
- **Created**: ${new Date(result.created).toLocaleString()}
- **Time in Seconds**: ${result.timeSpentSeconds}

## Quick Actions
- View all worklogs: Use \`get_worklogs\` with issueKey: ${params.issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${params.issueKey}
- Add another worklog: Use \`add_worklog\` again

## Time Format Examples
- Hours: "2h", "4h 30m"
- Days: "1d", "2d 4h"
- Minutes: "30m", "1h 15m"
- Mixed: "1w 2d 3h 30m"`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to add worklog to ${params.issueKey}:`, error);
      throw new Error(`Failed to add work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWorklogs(issueKey: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching worklogs for issue: ${issueKey}`);

      const response = await this.apiClient.getWorklogs(issueKey);
      const worklogs = response.worklogs || [];

      if (worklogs.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# ⏱️ Work Logs for ${issueKey}

No work logs found for this issue.

## Quick Actions
- Add work log: Use \`add_worklog\` with issueKey: ${issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${issueKey}`,
            },
          ],
        };
      }

      const tableData = worklogs.map((worklog: any) => [
        worklog.author.displayName,
        worklog.timeSpent,
        new Date(worklog.started).toLocaleDateString(),
        new Date(worklog.created).toLocaleDateString(),
        worklog.comment ? 'Yes' : 'No',
      ]);

      const markdownTable = formatMarkdownTable(
        ['Author', 'Time Spent', 'Work Date', 'Logged Date', 'Has Comment'],
        tableData
      );

      const totalSeconds = worklogs.reduce((sum: number, w: any) => sum + w.timeSpentSeconds, 0);
      const totalTime = this.formatDuration(totalSeconds);
      const uniqueAuthors = [...new Set(worklogs.map((w: any) => w.author.displayName))];

      return {
        content: [
          {
            type: 'text',
            text: `# ⏱️ Work Logs for ${issueKey}

**Total Time Logged**: ${totalTime}
**Total Entries**: ${worklogs.length}
**Contributors**: ${uniqueAuthors.length}

${markdownTable}

## Summary
- **Total Time (seconds)**: ${totalSeconds}
- **Contributors**: ${uniqueAuthors.join(', ')}
- **Latest Entry**: ${new Date(Math.max(...worklogs.map((w: any) => new Date(w.created).getTime()))).toLocaleString()}
- **Earliest Entry**: ${new Date(Math.min(...worklogs.map((w: any) => new Date(w.created).getTime()))).toLocaleString()}

## Quick Actions
- Add more work: Use \`add_worklog\` with issueKey: ${issueKey}
- View issue details: Use \`get_issue_details\` with issueKey: ${issueKey}

### Recent Work Log Details
${worklogs.slice(-3).map((w: any) => `
**${w.author.displayName}** - ${w.timeSpent} (${new Date(w.started).toLocaleDateString()})
${w.comment ? `Comment: ${typeof w.comment === 'string' ? w.comment : 'Rich text comment'}` : 'No comment'}
`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get worklogs for ${issueKey}:`, error);
      throw new Error(`Failed to retrieve work logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      const remainingHours = Math.floor((seconds % 86400) / 3600);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }

  async updateWorklog(params: {
    issueKey: string;
    worklogId: string;
    timeSpent?: string;
    comment?: string;
    startDate?: string;
  }): Promise<ToolResult> {
    try {
      this.logger.debug(`Updating worklog ${params.worklogId} on issue: ${params.issueKey}`, params);

      // Build update data object, only including defined properties
      const updateData: { timeSpent?: string; comment?: string; started?: string } = {};
      if (params.timeSpent !== undefined) updateData.timeSpent = params.timeSpent;
      if (params.comment !== undefined) updateData.comment = params.comment;
      if (params.startDate !== undefined) updateData.started = params.startDate;

      const result = await this.apiClient.updateWorklog(
        params.issueKey,
        params.worklogId,
        updateData
      );

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Work Log Updated Successfully!

**Issue**: ${params.issueKey}
**Work Log ID**: ${params.worklogId}
${params.timeSpent ? `**New Time Spent**: ${params.timeSpent}` : ''}
${params.comment ? `**New Comment**: ${params.comment}` : ''}
${params.startDate ? `**New Start Date**: ${params.startDate}` : ''}

## Updated Details
- **Author**: ${result.author?.displayName || 'Unknown'}
- **Time Spent**: ${result.timeSpent}
- **Time in Seconds**: ${result.timeSpentSeconds}
- **Updated**: ${new Date(result.updated).toLocaleString()}

## Quick Actions
- View all worklogs: Use \`get_worklogs\` with issueKey: ${params.issueKey}
- Delete this worklog: Use \`delete_worklog\` with worklogId: ${params.worklogId}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to update worklog ${params.worklogId}:`, error);
      throw new Error(`Failed to update work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteWorklog(params: {
    issueKey: string;
    worklogId: string;
  }): Promise<ToolResult> {
    try {
      this.logger.debug(`Deleting worklog ${params.worklogId} from issue: ${params.issueKey}`);

      await this.apiClient.deleteWorklog(params.issueKey, params.worklogId);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Work Log Deleted Successfully!

**Issue**: ${params.issueKey}
**Deleted Work Log ID**: ${params.worklogId}

The work log entry has been permanently removed.

## Quick Actions
- View remaining worklogs: Use \`get_worklogs\` with issueKey: ${params.issueKey}
- Add new worklog: Use \`add_worklog\` with issueKey: ${params.issueKey}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to delete worklog ${params.worklogId}:`, error);
      throw new Error(`Failed to delete work log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMyWorklogs(params: {
    startDate: string;
    endDate: string;
    projectKey?: string;
  }): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching worklogs for current user from ${params.startDate} to ${params.endDate}`);

      // Get current user
      const currentUser = await this.apiClient.getCurrentUser();
      const accountId = currentUser.accountId;

      // Build JQL to find issues with worklogs by current user in date range
      let jql = `worklogAuthor = currentUser() AND worklogDate >= "${params.startDate}" AND worklogDate <= "${params.endDate}"`;
      if (params.projectKey) {
        jql += ` AND project = ${params.projectKey}`;
      }

      // Search for issues
      const searchResult = await this.apiClient.searchIssues(jql, {
        maxResults: 100,
        startAt: 0,
        fields: ['key', 'summary', 'worklog']
      });
      const issues = searchResult.issues || [];

      if (issues.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# ⏱️ My Work Logs (${params.startDate} to ${params.endDate})

No work logs found for this date range.
${params.projectKey ? `Project filter: ${params.projectKey}` : ''}

## Quick Actions
- Add work log: Use \`add_worklog\`
- Search issues: Use \`search_issues\``,
            },
          ],
        };
      }

      // Collect all worklogs by current user within date range
      const startMs = new Date(params.startDate).getTime();
      const endMs = new Date(params.endDate).getTime() + (24 * 60 * 60 * 1000); // Include end date

      const myWorklogs: any[] = [];
      for (const issue of issues) {
        const worklogsResponse = await this.apiClient.getWorklogs(issue.key);
        const worklogs = worklogsResponse.worklogs || [];

        for (const worklog of worklogs) {
          if (worklog.author.accountId === accountId) {
            const worklogDate = new Date(worklog.started).getTime();
            if (worklogDate >= startMs && worklogDate <= endMs) {
              myWorklogs.push({
                ...worklog,
                issueKey: issue.key,
                issueSummary: issue.fields.summary,
              });
            }
          }
        }
      }

      // Sort by date
      myWorklogs.sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());

      // Calculate totals
      const totalSeconds = myWorklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
      const totalTime = this.formatDuration(totalSeconds);

      // Group by day
      const byDay: { [key: string]: number } = {};
      for (const worklog of myWorklogs) {
        const day = new Date(worklog.started).toLocaleDateString();
        byDay[day] = (byDay[day] || 0) + worklog.timeSpentSeconds;
      }

      // Create table data
      const tableData = myWorklogs.map((w: any) => [
        w.issueKey,
        w.issueSummary.substring(0, 40) + (w.issueSummary.length > 40 ? '...' : ''),
        w.timeSpent,
        new Date(w.started).toLocaleDateString(),
        w.comment ? 'Yes' : 'No',
      ]);

      const markdownTable = formatMarkdownTable(
        ['Issue', 'Summary', 'Time', 'Date', 'Comment'],
        tableData
      );

      // Daily summary
      const dailySummary = Object.entries(byDay)
        .map(([day, seconds]) => `- **${day}**: ${this.formatDuration(seconds)}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `# ⏱️ My Work Logs (${params.startDate} to ${params.endDate})

**User**: ${currentUser.displayName}
**Total Time Logged**: ${totalTime}
**Total Entries**: ${myWorklogs.length}
**Unique Issues**: ${new Set(myWorklogs.map(w => w.issueKey)).size}
${params.projectKey ? `**Project**: ${params.projectKey}` : ''}

## Work Log Entries
${markdownTable}

## Daily Summary
${dailySummary}

## Time Breakdown
- **Total Hours**: ${(totalSeconds / 3600).toFixed(2)}h
- **Average per Entry**: ${this.formatDuration(Math.round(totalSeconds / myWorklogs.length))}

## Quick Actions
- Add more work: Use \`add_worklog\`
- Update entry: Use \`update_worklog\` with worklogId`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get my worklogs:', error);
      throw new Error(`Failed to retrieve worklogs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSprintWorklogs(params: {
    sprintId?: string;
    boardId?: string;
    groupBy?: 'user' | 'issue' | 'day';
  }): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching sprint worklogs', params);

      // Get sprint issues
      let sprintId = params.sprintId;

      if (!sprintId && params.boardId) {
        // Get active sprint for board
        const sprints = await this.apiClient.getBoardSprints(params.boardId, 'active');
        if (sprints.values && sprints.values.length > 0) {
          sprintId = sprints.values[0].id.toString();
        }
      }

      if (!sprintId) {
        // Try to get active sprint from configured board
        const boardId = await this.apiClient.resolveBoardId();
        const sprints = await this.apiClient.getBoardSprints(boardId, 'active');
        if (sprints.values && sprints.values.length > 0) {
          sprintId = sprints.values[0].id.toString();
        }
      }

      if (!sprintId) {
        return {
          content: [
            {
              type: 'text',
              text: `# ⚠️ No Active Sprint Found

Could not find an active sprint. Please provide a sprintId parameter or ensure there is an active sprint on your board.

## Quick Actions
- List sprints: Use \`get_board_sprints\`
- Get board details: Use \`get_board_details\``,
            },
          ],
        };
      }

      // Get sprint details
      const sprint = await this.apiClient.getSprint(sprintId);

      // Get sprint issues
      const sprintIssuesResponse = await this.apiClient.getSprintIssues(sprintId);
      const issues = sprintIssuesResponse.issues || [];

      if (issues.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# ⏱️ Sprint Worklogs: ${sprint.name}

**Sprint**: ${sprint.name}
**Status**: ${sprint.state}
**No issues found in this sprint.**

## Quick Actions
- Add issues to sprint: Use \`add_issues_to_sprint\``,
            },
          ],
        };
      }

      // Collect all worklogs
      const allWorklogs: any[] = [];
      for (const issue of issues) {
        try {
          const worklogsResponse = await this.apiClient.getWorklogs(issue.key);
          const worklogs = worklogsResponse.worklogs || [];
          for (const worklog of worklogs) {
            allWorklogs.push({
              ...worklog,
              issueKey: issue.key,
              issueSummary: issue.fields.summary,
            });
          }
        } catch (e) {
          // Skip issues where we can't get worklogs
          this.logger.debug(`Could not get worklogs for ${issue.key}`);
        }
      }

      const totalSeconds = allWorklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
      const totalTime = this.formatDuration(totalSeconds);

      // Group data based on groupBy parameter
      let groupedContent = '';
      const groupBy = params.groupBy || 'user';

      if (groupBy === 'user') {
        const byUser: { [key: string]: { seconds: number; entries: number } } = {};
        for (const worklog of allWorklogs) {
          const name = worklog.author.displayName;
          if (!byUser[name]) byUser[name] = { seconds: 0, entries: 0 };
          byUser[name].seconds += worklog.timeSpentSeconds;
          byUser[name].entries += 1;
        }
        groupedContent = Object.entries(byUser)
          .sort((a, b) => b[1].seconds - a[1].seconds)
          .map(([name, data]) => `| ${name} | ${this.formatDuration(data.seconds)} | ${data.entries} |`)
          .join('\n');
        groupedContent = `| User | Time Logged | Entries |\n|------|-------------|---------|
${groupedContent}`;
      } else if (groupBy === 'issue') {
        const byIssue: { [key: string]: { seconds: number; summary: string } } = {};
        for (const worklog of allWorklogs) {
          if (!byIssue[worklog.issueKey]) byIssue[worklog.issueKey] = { seconds: 0, summary: worklog.issueSummary };
          byIssue[worklog.issueKey].seconds += worklog.timeSpentSeconds;
        }
        groupedContent = Object.entries(byIssue)
          .sort((a, b) => b[1].seconds - a[1].seconds)
          .map(([key, data]) => `| ${key} | ${data.summary.substring(0, 30)}... | ${this.formatDuration(data.seconds)} |`)
          .join('\n');
        groupedContent = `| Issue | Summary | Time Logged |\n|-------|---------|-------------|
${groupedContent}`;
      } else if (groupBy === 'day') {
        const byDay: { [key: string]: number } = {};
        for (const worklog of allWorklogs) {
          const day = new Date(worklog.started).toLocaleDateString();
          byDay[day] = (byDay[day] || 0) + worklog.timeSpentSeconds;
        }
        groupedContent = Object.entries(byDay)
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .map(([day, seconds]) => `| ${day} | ${this.formatDuration(seconds)} |`)
          .join('\n');
        groupedContent = `| Date | Time Logged |\n|------|-------------|
${groupedContent}`;
      }

      const uniqueUsers = [...new Set(allWorklogs.map(w => w.author.displayName))];

      return {
        content: [
          {
            type: 'text',
            text: `# ⏱️ Sprint Worklogs: ${sprint.name}

**Sprint**: ${sprint.name}
**Status**: ${sprint.state}
**Start Date**: ${sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Not set'}
**End Date**: ${sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'Not set'}

## Summary
- **Total Time Logged**: ${totalTime}
- **Total Entries**: ${allWorklogs.length}
- **Issues with Worklogs**: ${new Set(allWorklogs.map(w => w.issueKey)).size} / ${issues.length}
- **Contributors**: ${uniqueUsers.length}

## Breakdown by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
${groupedContent}

## Team Members
${uniqueUsers.join(', ')}

## Quick Actions
- Add worklog: Use \`add_worklog\`
- Get issue worklogs: Use \`get_worklogs\` with issueKey`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get sprint worklogs:', error);
      throw new Error(`Failed to retrieve sprint worklogs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}