import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const seriesId = searchParams.get('series_id');
  const apiKey = searchParams.get('api_key');

  if (!seriesId || !apiKey) {
    return NextResponse.json({ error: 'Missing series_id or api_key' }, { status: 400 });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}&file_type=json`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `FRED API returned ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    const series = data.seriess?.[0] || {};
    return NextResponse.json({
      title: series.title || seriesId,
      units: series.units || '',
      frequency: series.frequency || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
