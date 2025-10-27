import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
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
export declare class BulkOperationsService {
    private apiClient;
    private logger;
    constructor(apiClient: JiraApiClient);
    bulkCreateIssues(params: BulkCreateIssuesParams): Promise<ToolResult>;
    bulkUpdateIssues(params: BulkUpdateIssuesParams): Promise<ToolResult>;
    bulkTransitionIssues(params: BulkTransitionIssuesParams): Promise<ToolResult>;
    bulkAssignIssues(issueKeys: string[], assignee: string): Promise<ToolResult>;
}
