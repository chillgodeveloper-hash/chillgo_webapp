import { NextRequest, NextResponse } from 'next/server';

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || '';
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'flights') {
      const origin = searchParams.get('origin') || 'BKK';
      const destination = searchParams.get('destination') || '';
      const departDate = searchParams.get('depart_date') || '';
      const returnDate = searchParams.get('return_date') || '';
      const oneway = searchParams.get('one_way') || 'false';

      let url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&currency=thb&locale=th&market=th&limit=10&one_way=${oneway}&token=${TP_TOKEN}`;
      if (destination) url += `&destination=${destination}`;
      if (departDate) url += `&departure_at=${departDate}`;
      if (returnDate) url += `&return_at=${returnDate}`;

      const res = await fetch(url);
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
        link: `https://www.aviasales.com/search/${f.link}`,
        affiliateLink: `https://tp.media/r?marker=${TP_MARKER}&trs=368880&p=4114&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%2F${encodeURIComponent(f.link)}`,
      }));

      return NextResponse.json({ flights });
    }

    if (type === 'flights_popular') {
      const origin = searchParams.get('origin') || 'BKK';
      const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&currency=thb&locale=th&market=th&limit=6&one_way=false&unique=true&sorting=price&token=${TP_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      const flights = (data.data || []).map((f: any) => ({
        origin: f.origin,
        destination: f.destination,
        price: f.value,
        airline: f.airline,
        departureAt: f.departure_at,
        returnAt: f.return_at,
        transfers: f.number_of_changes,
        link: `https://www.aviasales.com/search/${f.link}`,
        affiliateLink: `https://tp.media/r?marker=${TP_MARKER}&trs=368880&p=4114&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%2F${encodeURIComponent(f.link)}`,
      }));

      return NextResponse.json({ flights });
    }

    if (type === 'hotels') {
      const cityId = searchParams.get('city_id') || '12209';
      const checkIn = searchParams.get('check_in') || '';
      const checkOut = searchParams.get('check_out') || '';
      const limit = searchParams.get('limit') || '10';

      let url = `https://yasen.hotellook.com/tp/public/widget_location_dump.json?currency=thb&language=th&limit=${limit}&id=${cityId}&type=popularity&token=${TP_TOKEN}`;
      if (checkIn) url += `&check_in=${checkIn}`;
      if (checkOut) url += `&check_out=${checkOut}`;

      const res = await fetch(url);
      const data = await res.json();

      const hotels = (data || []).map((h: any) => ({
        id: h.hotel_id,
        name: h.hotel_name,
        stars: h.stars,
        priceFrom: h.price_from,
        priceAvg: h.price_avg,
        rating: h.rating,
        photoId: h.photo_id,
        photoUrl: h.photo_id ? `https://photo.hotellook.com/image_v2/crop/h${h.hotel_id}_${h.photo_id}/640/480.auto` : null,
        location: h.location,
        link: `https://search.hotellook.com/hotels?destination=${cityId}&checkIn=${checkIn || ''}&checkOut=${checkOut || ''}&marker=${TP_MARKER}`,
      }));

      return NextResponse.json({ hotels });
    }

    if (type === 'hotels_popular') {
      const cityId = searchParams.get('city_id') || '12209';
      const url = `https://yasen.hotellook.com/tp/public/widget_location_dump.json?currency=thb&language=th&limit=6&id=${cityId}&type=popularity&token=${TP_TOKEN}`;

      const res = await fetch(url);
      const data = await res.json();

      const hotels = (data || []).map((h: any) => ({
        id: h.hotel_id,
        name: h.hotel_name,
        stars: h.stars,
        priceFrom: h.price_from,
        rating: h.rating,
        photoUrl: h.photo_id ? `https://photo.hotellook.com/image_v2/crop/h${h.hotel_id}_${h.photo_id}/640/480.auto` : null,
        link: `https://search.hotellook.com/hotels?destination=${cityId}&marker=${TP_MARKER}`,
      }));

      return NextResponse.json({ hotels });
    }

    if (type === 'city_lookup') {
      const query = searchParams.get('query') || '';
      const url = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(query)}&lang=en&lookFor=city&limit=5&token=${TP_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      const cities = (data.results?.locations || []).map((c: any) => ({
        id: c.id,
        name: c.cityName || c.name,
        country: c.countryName,
        iata: c.iata?.[0] || '',
      }));

      return NextResponse.json({ cities });
    }

    if (type === 'airport_lookup') {
      const query = searchParams.get('query') || '';
      const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(query)}&locale=th&types[]=airport&types[]=city`;
      const res = await fetch(url);
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
