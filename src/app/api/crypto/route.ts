import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = searchParams.get('ids') || 'bitcoin,ethereum,solana,dogecoin,cardano,ripple,polkadot,avalanche-2,chainlink,tron,near,aptos,sui,fantom,algorand';
  const vsCurrency = searchParams.get('vs') || 'usd';

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vsCurrency)}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );
    if (!res.ok) return NextResponse.json({ error: 'CoinGecko returned ' + res.status }, { status: 502 });
    return NextResponse.json(await res.json());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
