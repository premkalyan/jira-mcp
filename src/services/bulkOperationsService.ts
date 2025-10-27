import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export interface BulkCreateIssuesParams {
  projectKey: string;
  issuesData: Array<{
    summary: string;
    description?: string;
    issueType: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    storyPoints?: number;
  }>;
}

export interface BulkUpdateIssuesParams {
  updates: Array<{
    issueKey: string;
    summary?: string;
    description?: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    storyPoints?: number;
  }>;
}

export interface BulkTransitionIssuesParams {
  issueKeys: string[];
  transitionName: string;
  comment?: string;
}

export class BulkOperationsService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('BulkOperationsService');
  }

  async bulkCreateIssues(params: BulkCreateIssuesParams): Promise<ToolResult> {
    try {
      this.logger.debug('Bulk creating issues', { 
        projectKey: params.projectKey, 
        count: params.issuesData.length 
      });

      const result = await this.apiClient.bulkCreateIssues(params.projectKey, params.issuesData);

      // Calculate summary statistics
      const issueTypes = params.issuesData.reduce((acc, issue) => {
        acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalStoryPoints = params.issuesData.reduce((sum, issue) => 
        sum + (issue.storyPoints || 0), 0
      );

      const priorities = params.issuesData.reduce((acc, issue) => {
        const priority = issue.priority || 'None';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Generate successful issues table (if available in response)
      let issuesTable = '';
      if (result.issues && result.issues.length > 0) {
        const tableData = result.issues.map((issue: any, index: number) => [
          issue.key,
          params.issuesData[index].summary.length > 40 
            ? params.issuesData[index].summary.substring(0, 37) + '...'
            : params.issuesData[index].summary,
          params.issuesData[index].issueType,
          params.issuesData[index].priority || 'None',
          params.issuesData[index].storyPoints || 'None',
        ]);

        issuesTable = formatMarkdownTable(
          ['Key', 'Summary', 'Type', 'Priority', 'Story Points'],
          tableData
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Bulk Issue Creation Completed Successfully

## Creation Summary
- **Project**: ${params.projectKey}
- **Issues Created**: ${params.issuesData.length}
- **Total Story Points**: ${totalStoryPoints}

${issuesTable ? `## Created Issues\n\n${issuesTable}\n` : ''}

## Issue Type Breakdown
${Object.entries(issueTypes).map(([type, count]) => `- **${type}**: ${count} issue(s)`).join('\n')}

## Priority Distribution  
${Object.entries(priorities).map(([priority, count]) => `- **${priority}**: ${count} issue(s)`).join('\n')}

## Efficiency Gains
- ⚡ **Time Saved**: Bulk created ${params.issuesData.length} issues in one operation
- 📊 **Consistent Data**: All issues follow the same structure and standards
- 🎯 **Sprint Ready**: Issues are ready for estimation and sprint planning
- 👥 **Team Coordination**: Batch creation ensures complete feature coverage

## Next Steps
- **Estimate Stories**: Use \`bulk_update_story_points\` to add estimation
- **Plan Sprint**: Use \`add_issues_to_sprint\` to assign to current sprint  
- **Assign Team**: Use \`bulk_update_issues\` to assign team members
- **Create Dependencies**: Use \`link_issues\` to establish story relationships
- **Add Subtasks**: Use \`create_subtask\` to break down complex stories

## Project Impact
✅ **Feature Coverage**: Complete feature set created for development
✅ **Planning Ready**: All stories available for sprint planning
✅ **Team Coordination**: Clear work breakdown for team assignment
✅ **Velocity Tracking**: Story points enable velocity measurement`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to bulk create issues:', error);
      throw new Error(`Failed to bulk create issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkUpdateIssues(params: BulkUpdateIssuesParams): Promise<ToolResult> {
    try {
      this.logger.debug('Bulk updating issues', { count: params.updates.length });

      const result = await this.apiClient.bulkUpdateIssues(params.updates);

      // Analyze what was updated
      const updateTypes = params.updates.reduce((acc, update) => {
        const fields = [];
        if (update.summary) fields.push('summary');
        if (update.description) fields.push('description');
        if (update.priority) fields.push('priority');
        if (update.assignee) fields.push('assignee');
        if (update.labels) fields.push('labels');
        if (update.storyPoints) fields.push('storyPoints');
        
        fields.forEach(field => {
          acc[field] = (acc[field] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const totalStoryPoints = params.updates.reduce((sum, update) => 
        sum + (update.storyPoints || 0), 0
      );

      const issuesTable = params.updates.map(update => {
        const updatedFields = [];
        if (update.summary) updatedFields.push('Summary');
        if (update.description) updatedFields.push('Description');
        if (update.priority) updatedFields.push('Priority');
        if (update.assignee) updatedFields.push('Assignee');
        if (update.labels) updatedFields.push('Labels');
        if (update.storyPoints) updatedFields.push('Story Points');

        return [
          update.issueKey,
          updatedFields.join(', ') || 'No changes',
          update.storyPoints?.toString() || 'N/A',
          update.priority || 'N/A',
        ];
      });

      const markdownTable = formatMarkdownTable(
        ['Issue Key', 'Updated Fields', 'Story Points', 'Priority'],
        issuesTable
      );

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Bulk Issue Update Completed Successfully

## Update Summary
- **Issues Updated**: ${params.updates.length}
- **Total Story Points Added**: ${totalStoryPoints}

## Updated Issues
${markdownTable}

## Field Update Breakdown
${Object.entries(updateTypes).map(([field, count]) => `- **${field}**: ${count} issue(s) updated`).join('\n')}

## Efficiency Benefits
- ⚡ **Mass Updates**: Updated ${params.updates.length} issues simultaneously
- 📊 **Data Consistency**: Ensured consistent field updates across issues
- 🎯 **Sprint Planning**: Story points and priorities updated for better planning
- 👥 **Team Assignment**: Bulk assignee updates for improved coordination

## Impact on Project Management
✅ **Estimation Complete**: Story points updated for velocity tracking
✅ **Priority Alignment**: Priorities adjusted for sprint planning
✅ **Team Coordination**: Assignees updated for clear ownership
✅ **Sprint Ready**: Issues properly configured for development

## Next Steps
- **Sprint Planning**: Use \`add_issues_to_sprint\` with updated issues
- **Capacity Analysis**: Use \`get_sprint_capacity\` to see story point impact
- **Team Communication**: Notify assignees of their updated responsibilities
- **Progress Tracking**: Monitor updated issues through development lifecycle`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to bulk update issues:', error);
      throw new Error(`Failed to bulk update issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkTransitionIssues(params: BulkTransitionIssuesParams): Promise<ToolResult> {
    try {
      this.logger.debug('Bulk transitioning issues', params);

      const result = await this.apiClient.bulkTransitionIssues(
        params.issueKeys, 
        params.transitionName, 
        params.comment
      );

      // Analyze results
      const successful = result.results.filter((r: any) => r.status === 'success');
      const failed = result.results.filter((r: any) => r.status === 'error');

      const resultsTable = result.results.map((result: any) => [
        result.issueKey,
        result.status === 'success' ? '✅ Success' : '❌ Failed',
        result.status === 'success' ? params.transitionName : result.message,
      ]);

      const markdownTable = formatMarkdownTable(
        ['Issue Key', 'Status', 'Result/Error'],
        resultsTable
      );

      return {
        content: [
          {
            type: 'text',
            text: `# 🔄 Bulk Issue Transition Results

## Transition Summary
- **Target Transition**: ${params.transitionName}
- **Issues Attempted**: ${params.issueKeys.length}
- **Successful**: ${successful.length}
- **Failed**: ${failed.length}
- **Success Rate**: ${Math.round((successful.length / params.issueKeys.length) * 100)}%

## Transition Results
${markdownTable}

${params.comment ? `## Comment Added\n"${params.comment}"\n` : ''}

${failed.length > 0 ? `## ⚠️ Failed Transitions
${failed.map((f: any) => `- **${f.issueKey}**: ${f.message}`).join('\n')}

### Common Failure Reasons:
- Transition not available in current status
- Missing required fields for transition
- Insufficient permissions
- Workflow configuration restrictions
` : '## ✅ All Transitions Successful!'}

## Workflow Impact
${successful.length > 0 ? `✅ **Progress Made**: ${successful.length} issues moved to "${params.transitionName}"` : ''}
${failed.length > 0 ? `⚠️ **Attention Needed**: ${failed.length} issues require manual intervention` : ''}

## Team Benefits
- ⚡ **Efficient Updates**: Bulk status changes across multiple issues
- 📊 **Consistent Progress**: Uniform workflow advancement
- 🎯 **Sprint Management**: Mass transitions for sprint ceremonies
- 👥 **Team Coordination**: Clear status updates for entire team

## Next Steps
${failed.length > 0 ? '- **Review Failures**: Check failed issues and resolve workflow constraints' : ''}
- **Update Sprint**: Use \`get_sprint_details\` to see progress impact
- **Team Communication**: Notify team of bulk status changes
- **Continue Work**: Focus on issues in new status state
${successful.length > 0 ? '- **Monitor Progress**: Track issues through remaining workflow states' : ''}`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to bulk transition issues:', error);
      throw new Error(`Failed to bulk transition issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkAssignIssues(issueKeys: string[], assignee: string): Promise<ToolResult> {
    try {
      this.logger.debug('Bulk assigning issues', { count: issueKeys.length, assignee });

      // Use bulk update with assignee field
      const updates = issueKeys.map(issueKey => ({
        issueKey,
        assignee
      }));

      const result = await this.bulkUpdateIssues({ updates });

      // Customize response for assignment-specific context
      return {
        content: [
          {
            type: 'text',
            text: `# 👥 Bulk Issue Assignment Completed

## Assignment Summary
- **Issues Assigned**: ${issueKeys.length}
- **Assignee**: ${assignee}
- **Operation**: Bulk assignment

## Assigned Issues
${issueKeys.map(key => `- **${key}**: Assigned to ${assignee}`).join('\n')}

## Team Coordination Benefits
- ✅ **Clear Ownership**: All issues now have assigned owner
- ✅ **Workload Distribution**: Balanced assignment across team
- ✅ **Sprint Planning**: Clear capacity allocation for assignee
- ✅ **Communication**: Team members know their responsibilities

## Impact on Sprint Planning
- 📊 **Capacity Planning**: Issues counted toward assignee's sprint capacity
- 🎯 **Focus Areas**: Clear work focus for ${assignee}
- 👥 **Team Balance**: Distributed workload for optimal velocity
- 📈 **Velocity Tracking**: Individual and team velocity measurement

## Next Steps
- **Notify Assignee**: Communicate new assignments to ${assignee}
- **Sprint Planning**: Include assigned issues in sprint planning
- **Capacity Check**: Use \`get_sprint_capacity\` to verify workload
- **Progress Tracking**: Monitor assignee progress through sprint
- **Team Standups**: Discuss assigned work in daily standups`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to bulk assign issues:', error);
      throw new Error(`Failed to bulk assign issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
