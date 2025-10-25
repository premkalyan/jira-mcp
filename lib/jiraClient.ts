import axios, { AxiosInstance } from 'axios';

export interface JiraConfig {
  url: string;
  email: string;
  token: string;
}

export class JiraClient {
  private baseUrl: string;
  private auth: { email: string; token: string };
  private client: AxiosInstance;

  constructor(config: JiraConfig) {
    this.baseUrl = config.url;
    this.auth = { email: config.email, token: config.token };

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.getAuthHeader(),
      timeout: 30000
    });
  }

  private getAuthHeader() {
    const token = Buffer.from(`${this.auth.email}:${this.auth.token}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  async searchIssues(jql: string, maxResults = 50) {
    const response = await this.client.get('/rest/api/3/search/jql', {
      params: {
        jql,
        maxResults,
        fields: '*all' // Request all fields to match old API behavior
      }
    });
    return response.data;
  }

  async getIssue(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}`);
    return response.data;
  }

  async createIssue(fields: Record<string, unknown>) {
    const response = await this.client.post(
      '/rest/api/3/issue',
      { fields },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async updateIssue(issueKey: string, fields: Record<string, unknown>) {
    const response = await this.client.put(
      `/rest/api/3/issue/${issueKey}`,
      { fields },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async addComment(issueKey: string, body: string) {
    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/comment`,
      {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: body }
              ]
            }
          ]
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async transitionIssue(issueKey: string, transitionId: string) {
    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/transitions`,
      { transition: { id: transitionId } },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async getIssueTransitions(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}/transitions`);
    return response.data;
  }

  async linkIssues(type: string, inwardIssueKey: string, outwardIssueKey: string, comment?: string) {
    const payload: Record<string, unknown> = {
      type: { name: type },
      inwardIssue: { key: inwardIssueKey },
      outwardIssue: { key: outwardIssueKey }
    };

    if (comment) {
      payload.comment = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: comment }
              ]
            }
          ]
        }
      };
    }

    const response = await this.client.post(
      '/rest/api/3/issueLink',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async getIssueLinks(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}`, {
      params: { fields: 'issuelinks' }
    });
    return response.data;
  }

  async getDependencyTree(issueKey: string) {
    // Get the issue with all links
    const issue = await this.client.get(`/rest/api/3/issue/${issueKey}`, {
      params: { fields: 'issuelinks,subtasks,parent' }
    });

    // Build dependency tree recursively
    const buildTree = async (issueData: Record<string, unknown>) => {
      const fields = issueData.fields as Record<string, unknown>;
      const links = (fields?.issuelinks as unknown[]) || [];
      const subtasks = (fields?.subtasks as unknown[]) || [];
      const parent = fields?.parent as Record<string, unknown> | undefined;

      return {
        key: issueData.key,
        summary: fields?.summary,
        type: (fields?.issuetype as Record<string, unknown>)?.name,
        status: (fields?.status as Record<string, unknown>)?.name,
        parent: parent ? {
          key: parent.key,
          summary: (parent.fields as Record<string, unknown>)?.summary
        } : null,
        links: links.map((link: unknown) => {
          const linkObj = link as Record<string, unknown>;
          return {
            type: (linkObj.type as Record<string, unknown>)?.name,
            direction: linkObj.inwardIssue ? 'inward' : 'outward',
            linkedIssue: linkObj.inwardIssue || linkObj.outwardIssue
          };
        }),
        subtasks: subtasks.map((subtask: unknown) => {
          const subtaskObj = subtask as Record<string, unknown>;
          const subtaskFields = subtaskObj.fields as Record<string, unknown>;
          return {
            key: subtaskObj.key,
            summary: subtaskFields?.summary,
            status: (subtaskFields?.status as Record<string, unknown>)?.name
          };
        })
      };
    };

    return await buildTree(issue.data);
  }

  async getLinkTypes() {
    const response = await this.client.get('/rest/api/3/issueLinkType');
    return response.data;
  }

  // Board operations
  async getBoards(type?: string, name?: string) {
    const response = await this.client.get('/rest/agile/1.0/board', {
      params: { type, name }
    });
    return response.data;
  }

  async getBoardDetails(boardId: number) {
    const response = await this.client.get(`/rest/agile/1.0/board/${boardId}`);
    return response.data;
  }

  async getBoardIssues(boardId: number, jql?: string, maxResults = 50) {
    const response = await this.client.get(`/rest/agile/1.0/board/${boardId}/issue`, {
      params: { jql, maxResults }
    });
    return response.data;
  }

  // User operations
  async getCurrentUser() {
    const response = await this.client.get('/rest/api/3/myself');
    return response.data;
  }

  async searchUsers(query: string, maxResults = 50) {
    const response = await this.client.get('/rest/api/3/user/search', {
      params: { query, maxResults }
    });
    return response.data;
  }

  async getUserDetails(accountId: string) {
    const response = await this.client.get('/rest/api/3/user', {
      params: { accountId }
    });
    return response.data;
  }

  // Project operations
  async getProjects() {
    const response = await this.client.get('/rest/api/3/project');
    return response.data;
  }

  async getProjectDetails(projectKey: string) {
    const response = await this.client.get(`/rest/api/3/project/${projectKey}`);
    return response.data;
  }

  // Worklog operations
  async addWorklog(issueKey: string, timeSpentSeconds: number, comment?: string, started?: string) {
    const payload: Record<string, unknown> = {
      timeSpentSeconds
    };

    if (started) {
      payload.started = started;
    }

    if (comment) {
      payload.comment = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: comment }
            ]
          }
        ]
      };
    }

    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/worklog`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async getWorklogs(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}/worklog`);
    return response.data;
  }

  // Server information
  async getServerInfo() {
    const response = await this.client.get('/rest/api/3/serverInfo');
    return response.data;
  }

  // Sprint operations
  async createSprint(name: string, boardId: number, startDate?: string, endDate?: string, goal?: string) {
    const payload: Record<string, unknown> = {
      name,
      originBoardId: boardId
    };

    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;
    if (goal) payload.goal = goal;

    const response = await this.client.post(
      '/rest/agile/1.0/sprint',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async updateSprint(sprintId: number, updates: { name?: string; state?: string; startDate?: string; endDate?: string; goal?: string }) {
    const response = await this.client.put(
      `/rest/agile/1.0/sprint/${sprintId}`,
      updates,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}
