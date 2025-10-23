import { NextRequest, NextResponse } from 'next/server';
import { getJiraCredentials } from '@/lib/projectRegistry';
import { JiraClient } from '@/lib/jiraClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const { tool, arguments: args } = await request.json();

    if (!tool) {
      return NextResponse.json({ error: 'Tool name required' }, { status: 400 });
    }

    // Get credentials from Project Registry
    const credentials = await getJiraCredentials(apiKey);

    // Create JIRA client
    const jira = new JiraClient(credentials);

    // Execute tool
    let result;
    switch (tool) {
      case 'search_issues':
        result = await jira.searchIssues(args.jql, args.maxResults);
        break;

      case 'get_issue':
        result = await jira.getIssue(args.issueKey);
        break;

      case 'create_issue':
        result = await jira.createIssue(args.fields);
        break;

      case 'update_issue':
        result = await jira.updateIssue(args.issueKey, args.fields);
        break;

      case 'add_comment':
        result = await jira.addComment(args.issueKey, args.body);
        break;

      case 'transition_issue':
        result = await jira.transitionIssue(args.issueKey, args.transitionId);
        break;

      case 'get_issue_transitions':
        result = await jira.getIssueTransitions(args.issueKey);
        break;

      case 'link_issues':
        result = await jira.linkIssues(args.type, args.inwardIssueKey, args.outwardIssueKey, args.comment);
        break;

      case 'get_issue_links':
        result = await jira.getIssueLinks(args.issueKey);
        break;

      case 'get_dependency_tree':
        result = await jira.getDependencyTree(args.issueKey);
        break;

      case 'get_link_types':
        result = await jira.getLinkTypes();
        break;

      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, tool, result });
  } catch (error) {
    console.error('MCP error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'JIRA MCP Server',
    version: '2.1.0',
    availableTools: [
      'search_issues',
      'get_issue',
      'create_issue',
      'update_issue',
      'add_comment',
      'transition_issue',
      'get_issue_transitions',
      'link_issues',
      'get_issue_links',
      'get_dependency_tree',
      'get_link_types'
    ],
    usage: 'POST to this endpoint with tool name and arguments'
  });
}
