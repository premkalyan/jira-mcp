import { JiraApiClient } from './jiraApiClient.js';
import { ToolDefinition, ToolResult } from './types/index.js';
export declare class JiraToolRegistry {
    private apiClient;
    private logger;
    private boardService;
    private issueService;
    private userService;
    private projectService;
    private worklogService;
    private serverService;
    private sprintService;
    private issueLinkService;
    private bulkOperationsService;
    constructor(apiClient: JiraApiClient);
    getToolDefinitions(): ToolDefinition[];
    /**
     * Helper method to resolve board ID from args or configured board name
     * If no boardName is configured, fetches the default board for the project
     */
    private resolveBoardId;
    executeTool(toolName: string, args: Record<string, any>): Promise<ToolResult>;
}
