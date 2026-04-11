import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const seriesId = searchParams.get('series_id');
  const apiKey = searchParams.get('api_key');
  const limit = searchParams.get('limit') || '10';

  if (!seriesId || !apiKey) {
    return NextResponse.json({ error: 'Missing series_id or api_key' }, { status: 400 });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}&file_type=json&limit=${encodeURIComponent(limit)}&sort_order=desc`;
    const res = await fetch(url);
    
    if (!res.ok) {
      return NextResponse.json({ error: `FRED API returned ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    // Forward FRED errors
    if (data.error_code) {
      return NextResponse.json({ error_code: data.error_code, error_message: data.error_message }, { status: 400 });
    }

    return NextResponse.json({ observations: data.observations || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
