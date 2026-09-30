import { NextResponse } from 'next/server';
import { searchCandidatesSemantically } from '@/lib/search/vector-search';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const results = await searchCandidatesSemantically(query, limit);

    return NextResponse.json({
      query,
      count: results.length,
      candidates: results,
    });
  } catch (error) {
    console.error('[Semantic Candidate Search Error]:', error);
    return NextResponse.json(
      { error: 'Failed to search candidates' },
      { status: 500 }
    );
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

    const results = await searchCandidatesSemantically(query, limit);

    return NextResponse.json({
      query,
      count: results.length,
      candidates: results,
    });
  } catch (error) {
    console.error('[Semantic Candidate Search Error]:', error);
    return NextResponse.json(
      { error: 'Failed to search candidates' },
      { status: 500 }
    );
  }
}
