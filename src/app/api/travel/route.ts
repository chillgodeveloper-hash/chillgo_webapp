import { NextRequest, NextResponse } from 'next/server';

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || '';
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER || '';

const AIRPORT_CODE_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clean(s: string | null, max = 64): string {
  if (!s) return '';
  return s.slice(0, max).replace(/[^\w฀-๿\s.,-]/g, '');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'flights' || type === 'flights_popular') {
      const originRaw = (searchParams.get('origin') || 'BKK').toUpperCase();
      const destinationRaw = (searchParams.get('destination') || '').toUpperCase();
      const origin = AIRPORT_CODE_RE.test(originRaw) ? originRaw : 'BKK';
      const destination = AIRPORT_CODE_RE.test(destinationRaw) ? destinationRaw : '';
      const departDate = DATE_RE.test(searchParams.get('depart_date') || '') ? searchParams.get('depart_date')! : '';
      const returnDate = DATE_RE.test(searchParams.get('return_date') || '') ? searchParams.get('return_date')! : '';
      const oneway = searchParams.get('one_way') === 'true' ? 'true' : 'false';
      const limit = type === 'flights_popular' ? 6 : 10;
      const extra = type === 'flights_popular' ? '&unique=true&sorting=price' : '';

      const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
      url.searchParams.set('origin', origin);
      if (destination) url.searchParams.set('destination', destination);
      if (departDate) url.searchParams.set('departure_at', departDate);
      if (returnDate) url.searchParams.set('return_at', returnDate);
      url.searchParams.set('currency', 'thb');
      url.searchParams.set('locale', 'th');
      url.searchParams.set('market', 'th');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('one_way', oneway);
      if (TP_TOKEN) url.searchParams.set('token', TP_TOKEN);
      // unique+sorting only via the popular endpoint
      if (extra) {
        url.searchParams.set('unique', 'true');
        url.searchParams.set('sorting', 'price');
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      const flights = (data.data || []).map((f: any) => ({
        origin: f.origin,
        destination: f.destination,
        price: f.value,
        airline: f.airline,
        flightNumber: f.flight_number,
        departureAt: f.departure_at,
        returnAt: f.return_at,
        transfers: f.number_of_changes,
        affiliateLink: `https://tp.media/r?marker=${encodeURIComponent(TP_MARKER)}&trs=368880&p=4114&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%2F${encodeURIComponent(f.link || '')}`,
      }));

      return NextResponse.json({ flights });
    }

    if (type === 'airport_lookup') {
      const query = clean(searchParams.get('query'), 60);
      if (!query) return NextResponse.json({ places: [] });
      const url = new URL('https://autocomplete.travelpayouts.com/places2');
      url.searchParams.set('term', query);
      url.searchParams.set('locale', 'th');
      url.searchParams.append('types[]', 'airport');
      url.searchParams.append('types[]', 'city');
      const res = await fetch(url.toString());
      const data = await res.json();

      const places = (data || []).map((p: any) => ({
        code: p.code,
        name: p.name,
        cityName: p.city_name,
        countryName: p.country_name,
        type: p.type,
      }));

      return NextResponse.json({ places });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
