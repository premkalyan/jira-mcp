export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-black">
      <h1 className="text-4xl font-bold mb-4 text-black">JIRA MCP Server</h1>
      <p className="mb-4 text-gray-700">Version 2.1.0 - Serverless with Project Registry Integration</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Endpoints</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><code className="bg-gray-100 px-2 py-1 rounded text-black">/api/health</code> - Health check</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded text-black">/api/mcp</code> - Main MCP endpoint (POST)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Tools (11 total)</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Core Issue Operations</h3>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><strong className="text-black">search_issues</strong> - Search JIRA issues with JQL</li>
          <li><strong className="text-black">get_issue</strong> - Get issue details</li>
          <li><strong className="text-black">create_issue</strong> - Create new issue</li>
          <li><strong className="text-black">update_issue</strong> - Update existing issue</li>
          <li><strong className="text-black">add_comment</strong> - Add comment to issue</li>
          <li><strong className="text-black">transition_issue</strong> - Change issue status</li>
          <li><strong className="text-black">get_issue_transitions</strong> - Get available transitions for an issue</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Issue Linking & Dependencies</h3>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><strong className="text-black">link_issues</strong> - Link two issues together (blocks, relates to, etc.)</li>
          <li><strong className="text-black">get_issue_links</strong> - Get all links for a specific issue</li>
          <li><strong className="text-black">get_dependency_tree</strong> - Get complete dependency tree for an issue</li>
          <li><strong className="text-black">get_link_types</strong> - Get available link types (blocks, relates to, etc.)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Usage</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black">
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
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Example Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black">
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
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Integration</h2>
        <p className="mb-4 text-black">This JIRA MCP server integrates with the Project Registry to fetch JIRA credentials securely:</p>
        <ol className="list-decimal pl-6 space-y-2 text-black">
          <li>Register your project with JIRA credentials in the Project Registry</li>
          <li>Use the provided API key in the X-API-Key header</li>
          <li>The server fetches and decrypts your JIRA credentials automatically</li>
          <li>JIRA operations are executed with your credentials</li>
        </ol>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-700">
        <p>JIRA MCP Server v2.1.0 - Part of the Prometheus MCP Ecosystem</p>
      </footer>
    </div>
  );
}
