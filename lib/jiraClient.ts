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
    const response = await this.client.get('/rest/api/3/search', {
      params: { jql, maxResults }
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
}
