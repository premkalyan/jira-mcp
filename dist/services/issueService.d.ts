import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, SearchParams, IssueCreateRequest, IssueUpdateRequest, TransitionRequest } from '../types/index.js';
export declare class IssueService {
    private apiClient;
    private logger;
    constructor(apiClient: JiraApiClient);
    searchIssues(params: SearchParams): Promise<ToolResult>;
    getIssueDetails(params: {
        issueKey: string;
        includeComments?: boolean;
        includeWorklogs?: boolean;
    }): Promise<ToolResult>;
    createIssue(params: IssueCreateRequest): Promise<ToolResult>;
    updateIssue(params: IssueUpdateRequest): Promise<ToolResult>;
    transitionIssue(params: TransitionRequest): Promise<ToolResult>;
    addComment(params: {
        issueKey: string;
        comment: string;
    }): Promise<ToolResult>;
    setStoryPoints(issueKey: string, storyPoints: number): Promise<ToolResult>;
    getStoryPoints(issueKey: string): Promise<ToolResult>;
    bulkUpdateStoryPoints(updates: Array<{
        issueKey: string;
        storyPoints: number;
    }>): Promise<ToolResult>;
    createSubtask(parentIssueKey: string, subtaskData: {
        summary: string;
        description?: string;
        assignee?: string;
        priority?: string;
    }): Promise<ToolResult>;
    getSubtasks(parentIssueKey: string): Promise<ToolResult>;
}
