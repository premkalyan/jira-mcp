const PROJECT_REGISTRY_URL = process.env.PROJECT_REGISTRY_URL;

export interface JiraCredentials {
  url: string;
  email: string;
  token: string;
}

export async function getJiraCredentials(apiKey: string): Promise<JiraCredentials> {
  if (!PROJECT_REGISTRY_URL) {
    throw new Error('PROJECT_REGISTRY_URL environment variable is not configured');
  }

  const response = await fetch(`${PROJECT_REGISTRY_URL}/api/project?apiKey=${apiKey}`);

  if (!response.ok) {
    throw new Error('Invalid API key or project not found');
  }

  const { project } = await response.json();

  if (!project.configs?.jira) {
    throw new Error('JIRA not configured for this project');
  }

  return {
    url: project.configs.jira.baseUrl,
    email: project.configs.jira.email,
    token: project.configs.jira.apiToken
  };
}
