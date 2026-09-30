import { NextResponse } from 'next/server';
import { searchJobsSemantically } from '@/lib/search/vector-search';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;
    const remoteType = searchParams.get('remoteType') || undefined;
    const minSalary = searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!, 10) : undefined;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const results = await searchJobsSemantically(query, limit, { remoteType, minSalary });

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[Semantic Job Search Error]:', error);
    return NextResponse.json({ error: 'Failed to execute semantic search' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query;
    const limit = body.limit || 10;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await searchJobsSemantically(query, limit, {
      remoteType: body.remoteType,
      minSalary: body.minSalary,
    });

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[Semantic Job Search Error]:', error);
    return NextResponse.json({ error: 'Failed to execute semantic search' }, { status: 500 });
  }
}
