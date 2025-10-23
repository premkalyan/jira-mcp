export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">JIRA MCP Server</h1>
      <p className="mb-4 text-gray-600">Version 2.1.0 - Serverless with Project Registry Integration</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4">Available Endpoints</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><code className="bg-gray-100 px-2 py-1 rounded">/api/health</code> - Health check</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">/api/mcp</code> - Main MCP endpoint (POST)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4">Available Tools (11 total)</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">Core Issue Operations</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>search_issues</strong> - Search JIRA issues with JQL</li>
          <li><strong>get_issue</strong> - Get issue details</li>
          <li><strong>create_issue</strong> - Create new issue</li>
          <li><strong>update_issue</strong> - Update existing issue</li>
          <li><strong>add_comment</strong> - Add comment to issue</li>
          <li><strong>transition_issue</strong> - Change issue status</li>
          <li><strong>get_issue_transitions</strong> - Get available transitions for an issue</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Issue Linking & Dependencies</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>link_issues</strong> - Link two issues together (blocks, relates to, etc.)</li>
          <li><strong>get_issue_links</strong> - Get all links for a specific issue</li>
          <li><strong>get_dependency_tree</strong> - Get complete dependency tree for an issue</li>
          <li><strong>get_link_types</strong> - Get available link types (blocks, relates to, etc.)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4">Usage</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`POST /api/mcp
Headers:
  X-API-Key: pk_your_api_key
  Content-Type: application/json

Body:
{
  "tool": "search_issues",
  "arguments": {
    "jql": "project = PROJ AND status = 'In Progress'",
    "maxResults": 50
  }
}`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4">Example Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`{
  "success": true,
  "tool": "search_issues",
  "result": {
    "issues": [...],
    "total": 42,
    "maxResults": 50
  }
}`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4">Integration</h2>
        <p className="mb-4">This JIRA MCP server integrates with the Project Registry to fetch JIRA credentials securely:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Register your project with JIRA credentials in the Project Registry</li>
          <li>Use the provided API key in the X-API-Key header</li>
          <li>The server fetches and decrypts your JIRA credentials automatically</li>
          <li>JIRA operations are executed with your credentials</li>
        </ol>
      </section>

      <footer className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>JIRA MCP Server v2.1.0 - Part of the Prometheus MCP Ecosystem</p>
      </footer>
    </div>
  );
}
