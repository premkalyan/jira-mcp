import { JiraError } from './types/index.js';
import { Logger } from './utils/logger.js';
import { RateLimiter } from './utils/rateLimiter.js';
export class JiraApiClient {
    config;
    logger;
    rateLimiter;
    authHeader;
    customFields;
    boardConfig;
    constructor() {
        this.config = this.getJiraConfig();
        this.logger = new Logger('JiraApiClient');
        this.rateLimiter = new RateLimiter();
        this.authHeader = `Basic ${Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64')}`;
        this.customFields = {
            storyPoints: process.env.JIRA_STORY_POINTS_FIELD || 'customfield_10016',
            sprint: process.env.JIRA_SPRINT_FIELD || 'customfield_10020',
            epic: process.env.JIRA_EPIC_FIELD || 'customfield_10014'
        };
        this.boardConfig = {
            boardName: process.env.JIRA_BOARD_NAME || ''
        };
        this.logger.info(`Using custom field configuration: storyPoints=${this.customFields.storyPoints}`);
        this.logger.info(`Using board: ${this.boardConfig.boardName}`);
    }
    getJiraConfig() {
        const baseUrl = process.env.JIRA_BASE_URL;
        const email = process.env.JIRA_EMAIL;
        const apiToken = process.env.JIRA_API_TOKEN;
        if (!baseUrl || !email || !apiToken) {
            throw new Error('Missing Jira configuration. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.');
        }
        // Ensure baseUrl doesn't end with slash
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        return { baseUrl: cleanBaseUrl, email, apiToken };
    }
    async testConnection() {
        try {
            await this.makeRequest('/myself', { useV3Api: true });
            this.logger.info('Jira connection test successful');
        }
        catch (error) {
            this.logger.error('Jira connection test failed:', error);
            throw new Error('Failed to connect to Jira. Please check your credentials and network connection.');
        }
    }
    async makeRequest(endpoint, options = {}) {
        const { method = 'GET', body, useV3Api = false, useAgileApi = false, headers = {}, } = options;
        // Apply rate limiting
        await this.rateLimiter.waitForSlot();
        const apiPath = useAgileApi ? '/rest/agile/1.0' : useV3Api ? '/rest/api/3' : '/rest/api/2';
        const url = `${this.config.baseUrl}${apiPath}${endpoint}`;
        const requestHeaders = {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Enhanced-Jira-MCP-Server/2.0.0',
            ...headers,
        };
        this.logger.debug(`Making ${method} request to: ${url}`);
        try {
            const fetchOptions = {
                method,
                headers: requestHeaders,
            };
            // Only add body if it exists
            if (body !== undefined) {
                fetchOptions.body = JSON.stringify(body);
            }
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.errorMessages?.join(', ') || errorJson.message || errorText;
                }
                catch {
                    errorMessage = errorText;
                }
                throw new JiraError(`Jira API error: ${response.status} ${response.statusText}`, response.status, errorMessage);
            }
            const responseText = await response.text();
            if (!responseText) {
                return {};
            }
            return JSON.parse(responseText);
        }
        catch (error) {
            this.logger.error(`API request failed for ${url}:`, error);
            if (error instanceof JiraError) {
                throw error;
            }
            throw new JiraError('Network error occurred while making API request', 0, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    // Board-related methods
    async getBoards(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.type)
            queryParams.append('type', params.type);
        if (params.projectKeyOrId)
            queryParams.append('projectKeyOrId', params.projectKeyOrId);
        if (params.name)
            queryParams.append('name', params.name);
        const endpoint = `/board${queryParams.toString() ? `?${queryParams}` : ''}`;
        return this.makeRequest(endpoint, { useAgileApi: true });
    }
    async getBoard(boardId) {
        return this.makeRequest(`/board/${boardId}`, { useAgileApi: true });
    }
    /**
     * Get board by name - searches for boards matching the name
     * @param boardName - The name of the board to find
     * @param projectKey - Optional project key to filter boards
     * @returns The board object if found
     */
    async getBoardByName(boardName, projectKey) {
        this.logger.debug(`Looking up board by name: "${boardName}"`);
        const params = { name: boardName };
        if (projectKey)
            params.projectKeyOrId = projectKey;
        const response = await this.getBoards(params);
        const boards = response.values || [];
        if (boards.length === 0) {
            throw new JiraError(`No board found with name containing "${boardName}"`, 404, `Please check that the board name "${boardName}" is correct in your Project Registry configuration`);
        }
        // Prefer exact match, otherwise return first contains match
        const exactMatch = boards.find((b) => b.name === boardName);
        const selectedBoard = exactMatch || boards[0];
        this.logger.info(`Resolved board "${boardName}" to ID: ${selectedBoard.id} (${selectedBoard.name})`);
        return selectedBoard;
    }
    /**
     * Resolve the configured board name to a board ID
     * This is used by board-related operations to get the board ID
     * If boardName is not configured, fetches the default board for the project
     * @returns The board ID for the configured board or the default project board
     */
    async resolveBoardId() {
        // If boardName is configured, use it
        if (this.boardConfig.boardName) {
            const board = await this.getBoardByName(this.boardConfig.boardName);
            return board.id.toString();
        }
        // Otherwise, get the default board for the project (team-managed projects have only one)
        const projectKey = process.env.JIRA_PROJECT_KEY;
        this.logger.debug(`No boardName configured, fetching default board for project: ${projectKey || 'all'}`);
        const params = {};
        if (projectKey) {
            params.projectKeyOrId = projectKey;
        }
        const response = await this.getBoards(params);
        const boards = response.values || [];
        if (boards.length === 0) {
            throw new JiraError('No boards found', 404, projectKey
                ? `No boards found for project ${projectKey}. Please check your project configuration.`
                : 'No boards found. Please configure projectKey or boardName in Project Registry.');
        }
        // Use the first (and likely only) board for team-managed projects
        const defaultBoard = boards[0];
        this.logger.info(`Using default board: ${defaultBoard.name} (ID: ${defaultBoard.id})`);
        return defaultBoard.id.toString();
    }
    /**
     * Get the configured board name
     */
    getBoardName() {
        return this.boardConfig.boardName;
    }
    async getBoardIssues(boardId, params = {}) {
        // Alternative approach: Use search with board-specific JQL as the old endpoint is deprecated
        // First, get the board to find associated project
        try {
            const board = await this.getBoard(boardId);
            let boardJQL = '';
            if (board.location?.projectKey) {
                boardJQL = `project = "${board.location.projectKey}"`;
            }
            else {
                // Fallback: try to get board configuration
                boardJQL = `board = ${boardId}`;
            }
            // Combine with any additional JQL
            const combinedJQL = params.jql ? `${boardJQL} AND ${params.jql}` : boardJQL;
            // Use the updated searchIssues method
            const searchParams = {};
            if (params.maxResults !== undefined)
                searchParams.maxResults = params.maxResults;
            if (params.startAt !== undefined)
                searchParams.startAt = params.startAt;
            if (params.fields !== undefined)
                searchParams.fields = params.fields;
            return this.searchIssues(combinedJQL, searchParams);
        }
        catch (error) {
            this.logger.error(`Failed to get board issues for board ${boardId}:`, error);
            throw error;
        }
    }
    // Issue-related methods
    async searchIssues(jql, params = {}) {
        // Use new JQL endpoint as per Atlassian API migration (August 2025)
        const requestBody = {
            jql: jql,
            maxResults: params.maxResults || 50,
        };
        // Note: The new /search/jql endpoint returns only IDs by default
        // We need to make additional calls to get full issue details
        const response = await this.makeRequest('/search/jql', {
            method: 'POST',
            body: requestBody,
            useV3Api: true
        });
        // If we got issue IDs, fetch the full details
        if (response.issues && response.issues.length > 0) {
            const issueKeys = response.issues.map((issue) => issue.id);
            // Batch fetch issue details
            const fullIssues = await Promise.all(issueKeys.map(async (issueId) => {
                try {
                    const issueParams = {
                        fields: params.fields || [
                            'summary', 'status', 'assignee', 'priority', 'issuetype',
                            'created', 'updated', 'duedate', 'labels', 'key'
                        ]
                    };
                    if (params.expand)
                        issueParams.expand = params.expand;
                    return await this.getIssue(issueId, issueParams);
                }
                catch (error) {
                    this.logger.warn(`Failed to fetch details for issue ${issueId}:`, error);
                    return null;
                }
            }));
            // Filter out any failed requests and format response
            const validIssues = fullIssues.filter(issue => issue !== null);
            return {
                issues: validIssues,
                total: response.total || validIssues.length,
                startAt: params.startAt || 0,
                maxResults: params.maxResults || 50,
                isLast: response.isLast
            };
        }
        return response;
    }
    async getIssue(issueIdOrKey, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.fields)
            queryParams.append('fields', params.fields.join(','));
        if (params.expand)
            queryParams.append('expand', params.expand.join(','));
        const endpoint = `/issue/${issueIdOrKey}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return this.makeRequest(endpoint, { useV3Api: true });
    }
    async addComment(issueIdOrKey, comment) {
        const adfBody = {
            body: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: comment,
                            },
                        ],
                    },
                ],
            },
        };
        return this.makeRequest(`/issue/${issueIdOrKey}/comment`, {
            method: 'POST',
            body: adfBody,
            useV3Api: true,
        });
    }
    async updateIssue(issueIdOrKey, updateData) {
        await this.makeRequest(`/issue/${issueIdOrKey}`, {
            method: 'PUT',
            body: updateData,
            useV3Api: true,
        });
    }
    async createIssue(issueData) {
        return this.makeRequest('/issue', {
            method: 'POST',
            body: issueData,
            useV3Api: true,
        });
    }
    async transitionIssue(issueIdOrKey, transitionId, comment) {
        const body = {
            transition: { id: transitionId }
        };
        if (comment) {
            body.update = {
                comment: [{
                        add: {
                            body: {
                                type: 'doc',
                                version: 1,
                                content: [{
                                        type: 'paragraph',
                                        content: [{ type: 'text', text: comment }]
                                    }]
                            }
                        }
                    }]
            };
        }
        await this.makeRequest(`/issue/${issueIdOrKey}/transitions`, {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    async getIssueTransitions(issueIdOrKey) {
        return this.makeRequest(`/issue/${issueIdOrKey}/transitions`, { useV3Api: true });
    }
    // User-related methods
    async getCurrentUser() {
        return this.makeRequest('/myself', { useV3Api: true });
    }
    async searchUsers(query) {
        return this.makeRequest(`/user/search?query=${encodeURIComponent(query)}`, { useV3Api: true });
    }
    async getUser(accountId) {
        return this.makeRequest(`/user?accountId=${accountId}`, { useV3Api: true });
    }
    // Project-related methods
    async getProjects() {
        return this.makeRequest('/project', { useV3Api: true });
    }
    async getProject(projectIdOrKey) {
        return this.makeRequest(`/project/${projectIdOrKey}`, { useV3Api: true });
    }
    // Server info
    async getServerInfo() {
        return this.makeRequest('/serverInfo', { useV3Api: true });
    }
    // Worklog methods
    async addWorklog(issueIdOrKey, timeSpent, comment, startedDate) {
        const body = {
            timeSpent,
            started: startedDate || new Date().toISOString(),
        };
        if (comment) {
            body.comment = {
                type: 'doc',
                version: 1,
                content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: comment }]
                    }]
            };
        }
        return this.makeRequest(`/issue/${issueIdOrKey}/worklog`, {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    async getWorklogs(issueIdOrKey) {
        return this.makeRequest(`/issue/${issueIdOrKey}/worklog`, { useV3Api: true });
    }
    async getWorklogById(issueIdOrKey, worklogId) {
        return this.makeRequest(`/issue/${issueIdOrKey}/worklog/${worklogId}`, { useV3Api: true });
    }
    async updateWorklog(issueIdOrKey, worklogId, data) {
        const body = {};
        if (data.timeSpent) {
            body.timeSpent = data.timeSpent;
        }
        if (data.started) {
            body.started = data.started;
        }
        if (data.comment) {
            body.comment = {
                type: 'doc',
                version: 1,
                content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: data.comment }]
                    }]
            };
        }
        return this.makeRequest(`/issue/${issueIdOrKey}/worklog/${worklogId}`, {
            method: 'PUT',
            body,
            useV3Api: true,
        });
    }
    async deleteWorklog(issueIdOrKey, worklogId) {
        await this.makeRequest(`/issue/${issueIdOrKey}/worklog/${worklogId}`, {
            method: 'DELETE',
            useV3Api: true,
        });
    }
    async getWorklogsUpdatedSince(since) {
        // since is Unix timestamp in milliseconds
        return this.makeRequest(`/worklog/updated?since=${since}`, { useV3Api: true });
    }
    async getWorklogsByIds(worklogIds) {
        return this.makeRequest('/worklog/list', {
            method: 'POST',
            body: { ids: worklogIds },
            useV3Api: true,
        });
    }
    // Sprint-related methods (Priority 1)
    async createSprint(boardId, sprintData) {
        const body = {
            name: sprintData.name,
            originBoardId: parseInt(boardId),
            ...(sprintData.startDate && { startDate: sprintData.startDate }),
            ...(sprintData.endDate && { endDate: sprintData.endDate }),
            ...(sprintData.goal && { goal: sprintData.goal }),
        };
        return this.makeRequest('/sprint', {
            method: 'POST',
            body,
            useAgileApi: true,
        });
    }
    async updateSprint(sprintId, sprintData) {
        const body = {
            ...(sprintData.name && { name: sprintData.name }),
            ...(sprintData.startDate && { startDate: sprintData.startDate }),
            ...(sprintData.endDate && { endDate: sprintData.endDate }),
            ...(sprintData.goal && { goal: sprintData.goal }),
            ...(sprintData.state && { state: sprintData.state }),
        };
        return this.makeRequest(`/sprint/${sprintId}`, {
            method: 'PUT',
            body,
            useAgileApi: true,
        });
    }
    async getSprint(sprintId) {
        return this.makeRequest(`/sprint/${sprintId}`, { useAgileApi: true });
    }
    async getBoardSprints(boardId, state) {
        const queryParams = new URLSearchParams();
        // Don't add state parameter if it's "all" - let API return all sprints by default
        if (state && state !== 'all') {
            queryParams.append('state', state);
        }
        const endpoint = `/board/${boardId}/sprint${queryParams.toString() ? `?${queryParams}` : ''}`;
        return this.makeRequest(endpoint, { useAgileApi: true });
    }
    async moveIssuesToSprint(sprintId, issueKeys) {
        const body = {
            issues: issueKeys,
        };
        return this.makeRequest(`/sprint/${sprintId}/issue`, {
            method: 'POST',
            body,
            useAgileApi: true,
        });
    }
    async removeIssuesFromSprint(sprintId, issueKeys) {
        const body = {
            issues: issueKeys,
        };
        return this.makeRequest(`/sprint/${sprintId}/issue`, {
            method: 'DELETE',
            body,
            useAgileApi: true,
        });
    }
    async startSprint(sprintId, startDate, endDate) {
        const body = {
            state: 'active',
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
        };
        return this.makeRequest(`/sprint/${sprintId}`, {
            method: 'PUT',
            body,
            useAgileApi: true,
        });
    }
    async completeSprint(sprintId, incompleteIssuesAction) {
        const body = {
            state: 'closed',
        };
        // Note: incompleteIssuesAction handling may require additional API calls
        // to move issues to backlog or next sprint based on Jira setup
        return this.makeRequest(`/sprint/${sprintId}`, {
            method: 'PUT',
            body,
            useAgileApi: true,
        });
    }
    async getSprintIssues(sprintId, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.fields)
            queryParams.append('fields', params.fields.join(','));
        if (params.expand)
            queryParams.append('expand', params.expand.join(','));
        const endpoint = `/sprint/${sprintId}/issue${queryParams.toString() ? `?${queryParams}` : ''}`;
        return this.makeRequest(endpoint, { useAgileApi: true });
    }
    async getActiveSprint(boardId) {
        const response = await this.getBoardSprints(boardId, 'active');
        const activeSprints = response.values || [];
        return activeSprints.length > 0 ? activeSprints[0] : null;
    }
    // Story Points methods (Priority 3 - Critical)
    async setStoryPoints(issueIdOrKey, storyPoints) {
        const body = {
            fields: {
                [this.customFields.storyPoints]: storyPoints
            }
        };
        await this.makeRequest(`/issue/${issueIdOrKey}`, {
            method: 'PUT',
            body,
            useV3Api: true,
        });
    }
    async getStoryPoints(issueIdOrKey) {
        const issue = await this.getIssue(issueIdOrKey, {
            fields: [this.customFields.storyPoints]
        });
        return issue.fields?.[this.customFields.storyPoints] || null;
    }
    async bulkUpdateStoryPoints(updates) {
        const body = {
            issueUpdates: updates.map(update => ({
                key: update.issueKey,
                fields: {
                    [this.customFields.storyPoints]: update.storyPoints
                }
            }))
        };
        return this.makeRequest('/issue/bulk', {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    // Issue Linking methods (Priority 2 - Critical)
    async linkIssues(fromIssueKey, toIssueKey, linkType) {
        const body = {
            type: {
                name: linkType
            },
            inwardIssue: {
                key: toIssueKey
            },
            outwardIssue: {
                key: fromIssueKey
            }
        };
        return this.makeRequest('/issueLink', {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    async unlinkIssues(linkId) {
        await this.makeRequest(`/issueLink/${linkId}`, {
            method: 'DELETE',
            useV3Api: true,
        });
    }
    async getIssueLinks(issueIdOrKey) {
        const issue = await this.getIssue(issueIdOrKey, {
            fields: ['issuelinks']
        });
        return issue.fields?.issuelinks || [];
    }
    async getLinkTypes() {
        const response = await this.makeRequest('/issueLinkType', { useV3Api: true });
        return response.issueLinkTypes || [];
    }
    // Subtask methods (Priority 2)
    async createSubtask(parentIssueKey, subtaskData) {
        // First get parent issue to extract project info
        const parentIssue = await this.getIssue(parentIssueKey, {
            fields: ['project', 'issuetype']
        });
        const body = {
            fields: {
                project: {
                    key: parentIssue.fields.project.key
                },
                parent: {
                    key: parentIssueKey
                },
                summary: subtaskData.summary,
                description: subtaskData.description ? {
                    type: 'doc',
                    version: 1,
                    content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: subtaskData.description }]
                        }]
                } : undefined,
                issuetype: {
                    name: 'Sub-task'
                },
                ...(subtaskData.assignee && {
                    assignee: { accountId: subtaskData.assignee }
                }),
                ...(subtaskData.priority && {
                    priority: { name: subtaskData.priority }
                })
            }
        };
        return this.createIssue(body);
    }
    async getSubtasks(parentIssueKey) {
        const issue = await this.getIssue(parentIssueKey, {
            fields: ['subtasks']
        });
        return issue.fields?.subtasks || [];
    }
    // Bulk Creation methods (Priority 5 - Critical)
    async bulkCreateIssues(projectKey, issuesData) {
        const body = {
            issueUpdates: issuesData.map(issueData => ({
                fields: {
                    project: { key: projectKey },
                    summary: issueData.summary,
                    description: issueData.description ? {
                        type: 'doc',
                        version: 1,
                        content: [{
                                type: 'paragraph',
                                content: [{ type: 'text', text: issueData.description }]
                            }]
                    } : undefined,
                    issuetype: { name: issueData.issueType },
                    ...(issueData.priority && { priority: { name: issueData.priority } }),
                    ...(issueData.assignee && { assignee: { accountId: issueData.assignee } }),
                    ...(issueData.labels && { labels: issueData.labels.map(label => ({ name: label })) }),
                    ...(issueData.storyPoints && { [this.customFields.storyPoints]: issueData.storyPoints })
                }
            }))
        };
        return this.makeRequest('/issue/bulk', {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    async bulkUpdateIssues(updates) {
        const body = {
            issueUpdates: updates.map(update => {
                const fields = {};
                if (update.summary)
                    fields.summary = update.summary;
                if (update.description) {
                    fields.description = {
                        type: 'doc',
                        version: 1,
                        content: [{
                                type: 'paragraph',
                                content: [{ type: 'text', text: update.description }]
                            }]
                    };
                }
                if (update.priority)
                    fields.priority = { name: update.priority };
                if (update.assignee)
                    fields.assignee = { accountId: update.assignee };
                if (update.labels)
                    fields.labels = update.labels.map(label => ({ name: label }));
                if (update.storyPoints)
                    fields[this.customFields.storyPoints] = update.storyPoints;
                return {
                    key: update.issueKey,
                    fields
                };
            })
        };
        return this.makeRequest('/issue/bulk', {
            method: 'POST',
            body,
            useV3Api: true,
        });
    }
    async bulkTransitionIssues(issueKeys, transitionName, comment) {
        // Note: Bulk transitions require getting transition IDs for each issue first
        // This is a simplified implementation - production version would need individual transition ID lookup
        const results = [];
        for (const issueKey of issueKeys) {
            try {
                // Get available transitions
                const transitions = await this.getIssueTransitions(issueKey);
                const transition = transitions.transitions?.find((t) => t.name.toLowerCase() === transitionName.toLowerCase());
                if (transition) {
                    await this.transitionIssue(issueKey, transition.id, comment);
                    results.push({ issueKey, status: 'success' });
                }
                else {
                    results.push({ issueKey, status: 'error', message: `Transition '${transitionName}' not available` });
                }
            }
            catch (error) {
                results.push({
                    issueKey,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return { results };
    }
}
