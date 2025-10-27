import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
export interface LinkIssuesParams {
    fromIssueKey: string;
    toIssueKey: string;
    linkType: string;
}
export declare class IssueLinkService {
    private apiClient;
    private logger;
    constructor(apiClient: JiraApiClient);
    linkIssues(params: LinkIssuesParams): Promise<ToolResult>;
    getIssueLinks(issueKey: string): Promise<ToolResult>;
    getLinkTypes(): Promise<ToolResult>;
    getDependencyTree(issueKey: string, maxDepth?: number): Promise<ToolResult>;
}
