import { ApiResponse } from './types/index.js';
export declare class JiraApiClient {
    private config;
    private logger;
    private rateLimiter;
    private authHeader;
    private customFields;
    private boardConfig;
    constructor();
    private getJiraConfig;
    testConnection(): Promise<void>;
    makeRequest<T = any>(endpoint: string, options?: {
        method?: string;
        body?: any;
        useV3Api?: boolean;
        useAgileApi?: boolean;
        headers?: Record<string, string>;
    }): Promise<T>;
    getBoards(params?: {
        type?: string;
        projectKeyOrId?: string;
        name?: string;
    }): Promise<ApiResponse<any>>;
    getBoard(boardId: string): Promise<any>;
    /**
     * Get board by name - searches for boards matching the name
     * @param boardName - The name of the board to find
     * @param projectKey - Optional project key to filter boards
     * @returns The board object if found
     */
    getBoardByName(boardName: string, projectKey?: string): Promise<any>;
    /**
     * Resolve the configured board name to a board ID
     * This is used by board-related operations to get the board ID
     * If boardName is not configured, fetches the default board for the project
     * @returns The board ID for the configured board or the default project board
     */
    resolveBoardId(): Promise<string>;
    /**
     * Get the configured board name
     */
    getBoardName(): string;
    getBoardIssues(boardId: string, params?: {
        jql?: string;
        maxResults?: number;
        startAt?: number;
        fields?: string[];
    }): Promise<ApiResponse<any>>;
    searchIssues(jql: string, params?: {
        maxResults?: number;
        startAt?: number;
        fields?: string[];
        expand?: string[];
    }): Promise<ApiResponse<any>>;
    getIssue(issueIdOrKey: string, params?: {
        fields?: string[];
        expand?: string[];
    }): Promise<any>;
    addComment(issueIdOrKey: string, comment: string): Promise<any>;
    updateIssue(issueIdOrKey: string, updateData: any): Promise<void>;
    createIssue(issueData: any): Promise<any>;
    transitionIssue(issueIdOrKey: string, transitionId: string, comment?: string): Promise<void>;
    getIssueTransitions(issueIdOrKey: string): Promise<any>;
    getCurrentUser(): Promise<any>;
    searchUsers(query: string): Promise<any[]>;
    getUser(accountId: string): Promise<any>;
    getProjects(): Promise<any[]>;
    getProject(projectIdOrKey: string): Promise<any>;
    getServerInfo(): Promise<any>;
    addWorklog(issueIdOrKey: string, timeSpent: string, comment?: string, startedDate?: string): Promise<any>;
    getWorklogs(issueIdOrKey: string): Promise<any>;
    getWorklogById(issueIdOrKey: string, worklogId: string): Promise<any>;
    updateWorklog(issueIdOrKey: string, worklogId: string, data: {
        timeSpent?: string;
        comment?: string;
        started?: string;
    }): Promise<any>;
    deleteWorklog(issueIdOrKey: string, worklogId: string): Promise<void>;
    getWorklogsUpdatedSince(since: number): Promise<any>;
    getWorklogsByIds(worklogIds: number[]): Promise<any>;
    createSprint(boardId: string, sprintData: {
        name: string;
        startDate?: string;
        endDate?: string;
        goal?: string;
    }): Promise<any>;
    updateSprint(sprintId: string, sprintData: {
        name?: string;
        startDate?: string;
        endDate?: string;
        goal?: string;
        state?: string;
    }): Promise<any>;
    getSprint(sprintId: string): Promise<any>;
    getBoardSprints(boardId: string, state?: string): Promise<ApiResponse<any>>;
    moveIssuesToSprint(sprintId: string, issueKeys: string[]): Promise<any>;
    removeIssuesFromSprint(sprintId: string, issueKeys: string[]): Promise<any>;
    startSprint(sprintId: string, startDate?: string, endDate?: string): Promise<any>;
    completeSprint(sprintId: string, incompleteIssuesAction?: string): Promise<any>;
    getSprintIssues(sprintId: string, params?: {
        fields?: string[];
        expand?: string[];
    }): Promise<ApiResponse<any>>;
    getActiveSprint(boardId: string): Promise<any>;
    setStoryPoints(issueIdOrKey: string, storyPoints: number): Promise<void>;
    getStoryPoints(issueIdOrKey: string): Promise<number | null>;
    bulkUpdateStoryPoints(updates: Array<{
        issueKey: string;
        storyPoints: number;
    }>): Promise<any>;
    linkIssues(fromIssueKey: string, toIssueKey: string, linkType: string): Promise<any>;
    unlinkIssues(linkId: string): Promise<void>;
    getIssueLinks(issueIdOrKey: string): Promise<any>;
    getLinkTypes(): Promise<any[]>;
    createSubtask(parentIssueKey: string, subtaskData: {
        summary: string;
        description?: string;
        assignee?: string;
        priority?: string;
    }): Promise<any>;
    getSubtasks(parentIssueKey: string): Promise<any[]>;
    bulkCreateIssues(projectKey: string, issuesData: Array<{
        summary: string;
        description?: string;
        issueType: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
        storyPoints?: number;
    }>): Promise<any>;
    bulkUpdateIssues(updates: Array<{
        issueKey: string;
        summary?: string;
        description?: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
        storyPoints?: number;
    }>): Promise<any>;
    bulkTransitionIssues(issueKeys: string[], transitionName: string, comment?: string): Promise<any>;
}
