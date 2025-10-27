import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult } from '../types/index.js';
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
export declare class SprintService {
    private apiClient;
    private logger;
    private storyPointsField;
    constructor(apiClient: JiraApiClient);
    createSprint(params: CreateSprintParams): Promise<ToolResult>;
    updateSprint(params: UpdateSprintParams): Promise<ToolResult>;
    getSprintDetails(sprintId: string): Promise<ToolResult>;
    getBoardSprints(boardId: string, state?: string): Promise<ToolResult>;
    addIssuesToSprint(params: SprintIssueOperationParams): Promise<ToolResult>;
    removeIssuesFromSprint(params: SprintIssueOperationParams): Promise<ToolResult>;
    moveIssuesBetweenSprints(params: MoveIssuesBetweenSprintsParams): Promise<ToolResult>;
    startSprint(sprintId: string, startDate?: string, endDate?: string): Promise<ToolResult>;
    completeSprint(sprintId: string, incompleteIssuesAction?: string): Promise<ToolResult>;
    getActiveSprint(boardId: string): Promise<ToolResult>;
    getSprintCapacity(sprintId: string): Promise<ToolResult>;
    setSprintGoal(sprintId: string, goal: string): Promise<ToolResult>;
}
