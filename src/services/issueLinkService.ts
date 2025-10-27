import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

export interface LinkIssuesParams {
  fromIssueKey: string;
  toIssueKey: string;
  linkType: string;
}

export class IssueLinkService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('IssueLinkService');
  }

  async linkIssues(params: LinkIssuesParams): Promise<ToolResult> {
    try {
      this.logger.debug('Linking issues', params);

      await this.apiClient.linkIssues(params.fromIssueKey, params.toIssueKey, params.linkType);

      return {
        content: [
          {
            type: 'text',
            text: `# ✅ Issues Linked Successfully

## Link Details
- **From Issue**: ${params.fromIssueKey}
- **To Issue**: ${params.toIssueKey}
- **Link Type**: ${params.linkType}

## Dependency Management Benefits
- ✅ **Clear Dependencies**: Relationship between issues now visible
- ✅ **Impact Analysis**: Changes to ${params.toIssueKey} will impact ${params.fromIssueKey}
- ✅ **Planning Visibility**: Dependency visible in sprint planning
- ✅ **Team Coordination**: Clear handoff points between team members

## Available Link Types
- **"Blocks"**: ${params.fromIssueKey} blocks ${params.toIssueKey}
- **"Clones"**: ${params.fromIssueKey} clones ${params.toIssueKey}
- **"Duplicate"**: ${params.fromIssueKey} duplicates ${params.toIssueKey}
- **"Relates"**: ${params.fromIssueKey} relates to ${params.toIssueKey}

## Next Steps
- **View Dependencies**: Use \`get_issue_links\` to see all issue relationships
- **Impact Analysis**: Use \`get_dependency_tree\` for comprehensive view
- **Sprint Planning**: Consider dependencies when planning sprint work
- **Team Communication**: Notify affected team members of dependency`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to link issues:', error);
      throw new Error(`Failed to link issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIssueLinks(issueKey: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Getting issue links for ${issueKey}`);

      const links = await this.apiClient.getIssueLinks(issueKey);

      if (links.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `# 🔗 No Issue Links Found for ${issueKey}

## Status
- **Issue**: ${issueKey}
- **Links**: No dependencies or relationships

## Recommendations
- **Add Dependencies**: Use \`link_issues\` to create story dependencies
- **Identify Blockers**: Link issues that block this work
- **Related Work**: Link related stories for better context

## Common Link Types
- **"Blocks"**: Issues that must be completed before this one
- **"Depends on"**: Issues this one depends on  
- **"Relates to"**: Issues with related functionality
- **"Clones"**: Issues that are copies or variations

## Next Steps
- **Create Links**: Use \`link_issues\` to establish dependencies
- **Sprint Planning**: Consider dependencies when planning work
- **Team Coordination**: Link issues for better handoff visibility`,
            },
          ],
        };
      }

      // Separate inward and outward links
      const inwardLinks = links.filter((link: any) => link.inwardIssue);
      const outwardLinks = links.filter((link: any) => link.outwardIssue);

      let linkText = `# 🔗 Issue Links for ${issueKey}\n\n`;

      if (outwardLinks.length > 0) {
        linkText += `## Outward Links (${issueKey} → Others)\n\n`;
        const outwardTable = outwardLinks.map((link: any) => [
          link.type.outward,
          link.outwardIssue.key,
          link.outwardIssue.fields.summary,
          link.outwardIssue.fields.status.name,
          link.outwardIssue.fields.assignee?.displayName || 'Unassigned',
        ]);

        linkText += formatMarkdownTable(
          ['Relationship', 'Issue Key', 'Summary', 'Status', 'Assignee'],
          outwardTable
        ) + '\n\n';
      }

      if (inwardLinks.length > 0) {
        linkText += `## Inward Links (Others → ${issueKey})\n\n`;
        const inwardTable = inwardLinks.map((link: any) => [
          link.type.inward,
          link.inwardIssue.key,
          link.inwardIssue.fields.summary,
          link.inwardIssue.fields.status.name,
          link.inwardIssue.fields.assignee?.displayName || 'Unassigned',
        ]);

        linkText += formatMarkdownTable(
          ['Relationship', 'Issue Key', 'Summary', 'Status', 'Assignee'],
          inwardTable
        ) + '\n\n';
      }

      linkText += `## Dependency Analysis
- **Total Links**: ${links.length}
- **Outward Dependencies**: ${outwardLinks.length}
- **Inward Dependencies**: ${inwardLinks.length}

## Impact Assessment
${outwardLinks.some((link: any) => link.outwardIssue.fields.status.statusCategory.key !== 'done') 
  ? '⚠️ **Blocking Issues**: Some linked issues are not yet complete' 
  : '✅ **No Blockers**: All outward dependencies are resolved'}

${inwardLinks.some((link: any) => link.inwardIssue.fields.status.statusCategory.key !== 'done')
  ? '⚠️ **Dependent Work**: Some issues depend on this one being completed'
  : '📋 **No Dependencies**: No other issues are waiting on this one'}

## Available Actions
- **Add More Links**: Use \`link_issues\` to create additional dependencies
- **Remove Links**: Use \`unlink_issues\` to remove relationships
- **View Dependency Tree**: Use \`get_dependency_tree\` for comprehensive view
- **Sprint Planning**: Consider all dependencies when planning work`;

      return {
        content: [
          {
            type: 'text',
            text: linkText,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get issue links for ${issueKey}:`, error);
      throw new Error(`Failed to get issue links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLinkTypes(): Promise<ToolResult> {
    try {
      this.logger.debug('Getting available link types');

      const linkTypes = await this.apiClient.getLinkTypes();

      const tableData = linkTypes.map(linkType => [
        linkType.name,
        linkType.inward,
        linkType.outward,
        linkType.id,
      ]);

      const markdownTable = formatMarkdownTable(
        ['Link Type', 'Inward Description', 'Outward Description', 'ID'],
        tableData
      );

      return {
        content: [
          {
            type: 'text',
            text: `# 🔗 Available Issue Link Types

${markdownTable}

## Usage Examples

### Common Dependency Patterns:
- **Blocks/Blocked by**: Use when one issue must be completed before another
- **Clones/Cloned by**: Use for duplicate or similar issues
- **Duplicates/Duplicated by**: Use for exact duplicates
- **Relates to**: Use for general relationships

### Sprint Planning Links:
- **Epic-Story**: Link stories to their parent epic
- **Story-Task**: Link implementation tasks to user stories
- **Bug-Story**: Link bug fixes to related feature stories

## Best Practices
- ✅ **Use "Blocks"** for critical dependencies that prevent work
- ✅ **Use "Relates to"** for loose coupling between features
- ✅ **Use "Clones"** when creating similar issues for different contexts
- ✅ **Document Dependencies** in sprint planning sessions

## Next Steps
- **Create Links**: Use \`link_issues\` with appropriate link type names
- **Plan Dependencies**: Consider link types during sprint planning
- **Team Communication**: Use links to communicate handoff points`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get link types:', error);
      throw new Error(`Failed to get link types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDependencyTree(issueKey: string, maxDepth: number = 3): Promise<ToolResult> {
    try {
      this.logger.debug(`Getting dependency tree for ${issueKey}`, { maxDepth });

      // This is a simplified implementation - a full dependency tree would require recursive traversal
      const links = await this.apiClient.getIssueLinks(issueKey);
      
      // For now, show direct dependencies with indicators for further dependencies
      const blockedByIssues = links.filter((link: any) => 
        link.type.inward.toLowerCase().includes('blocked') && link.inwardIssue
      );
      
      const blockingIssues = links.filter((link: any) => 
        link.type.outward.toLowerCase().includes('blocks') && link.outwardIssue
      );

      let treeText = `# 🌳 Dependency Tree for ${issueKey}\n\n`;

      if (blockedByIssues.length > 0) {
        treeText += `## ⬆️ Issues Blocking ${issueKey}\n`;
        treeText += `*These must be completed before ${issueKey} can proceed*\n\n`;
        
        blockedByIssues.forEach((link: any) => {
          const issue = link.inwardIssue;
          const statusIcon = issue.fields.status.statusCategory.key === 'done' ? '✅' : '⏳';
          treeText += `${statusIcon} **${issue.key}**: ${issue.fields.summary}\n`;
          treeText += `   └── Status: ${issue.fields.status.name} | Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}\n\n`;
        });
      }

      treeText += `## 🎯 Current Issue\n`;
      treeText += `**${issueKey}** - *Focus of dependency analysis*\n\n`;

      if (blockingIssues.length > 0) {
        treeText += `## ⬇️ Issues Blocked by ${issueKey}\n`;
        treeText += `*These are waiting for ${issueKey} to be completed*\n\n`;
        
        blockingIssues.forEach((link: any) => {
          const issue = link.outwardIssue;
          const statusIcon = issue.fields.status.statusCategory.key === 'done' ? '✅' : '⏳';
          treeText += `${statusIcon} **${issue.key}**: ${issue.fields.summary}\n`;
          treeText += `   └── Status: ${issue.fields.status.name} | Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}\n\n`;
        });
      }

      // Analysis section
      const totalBlockers = blockedByIssues.length;
      const completedBlockers = blockedByIssues.filter((link: any) => 
        link.inwardIssue.fields.status.statusCategory.key === 'done'
      ).length;

      treeText += `## 📊 Dependency Analysis\n`;
      treeText += `- **Blocking Dependencies**: ${totalBlockers}\n`;
      treeText += `- **Completed Blockers**: ${completedBlockers}/${totalBlockers}\n`;
      treeText += `- **Blocked Issues**: ${blockingIssues.length}\n`;
      
      if (totalBlockers > 0) {
        const readiness = Math.round((completedBlockers / totalBlockers) * 100);
        treeText += `- **Readiness**: ${readiness}% (${completedBlockers} of ${totalBlockers} blockers done)\n\n`;
        
        if (readiness === 100) {
          treeText += `🚀 **Ready to Start**: All blocking dependencies are resolved!\n`;
        } else {
          treeText += `⏳ **Waiting**: ${totalBlockers - completedBlockers} blocking dependencies still in progress\n`;
        }
      } else {
        treeText += `✅ **No Blockers**: Issue is ready to begin work\n`;
      }

      treeText += `\n## 🔄 Impact Radius\n`;
      if (blockingIssues.length > 0) {
        treeText += `⚠️ **High Impact**: Completing this issue will unblock ${blockingIssues.length} dependent issue(s)\n`;
      } else {
        treeText += `📋 **Low Impact**: No other issues are waiting on this one\n`;
      }

      treeText += `\n## Next Steps\n`;
      treeText += `- **Sprint Planning**: Consider dependency chain when estimating work\n`;
      treeText += `- **Team Coordination**: Communicate with assignees of dependent issues\n`;
      treeText += `- **Progress Tracking**: Monitor blocker completion to optimize workflow\n`;
      if (maxDepth > 1) {
        treeText += `- **Deeper Analysis**: Use \`get_dependency_tree\` on linked issues for complete picture\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: treeText,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get dependency tree for ${issueKey}:`, error);
      throw new Error(`Failed to get dependency tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
