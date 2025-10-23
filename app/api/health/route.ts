import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'JIRA MCP Server',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
}
