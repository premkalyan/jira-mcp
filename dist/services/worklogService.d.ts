import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, WorklogRequest } from '../types/index.js';
export declare class WorklogService {
    private apiClient;
    private logger;
    constructor(apiClient: JiraApiClient);
    addWorklog(params: WorklogRequest): Promise<ToolResult>;
    getWorklogs(issueKey: string): Promise<ToolResult>;
    private formatDuration;
    updateWorklog(params: {
        issueKey: string;
        worklogId: string;
        timeSpent?: string;
        comment?: string;
        startDate?: string;
    }): Promise<ToolResult>;
    deleteWorklog(params: {
        issueKey: string;
        worklogId: string;
    }): Promise<ToolResult>;
    getMyWorklogs(params: {
        startDate: string;
        endDate: string;
        projectKey?: string;
    }): Promise<ToolResult>;
    getSprintWorklogs(params: {
        sprintId?: string;
        boardId?: string;
        groupBy?: 'user' | 'issue' | 'day';
    }): Promise<ToolResult>;
}
