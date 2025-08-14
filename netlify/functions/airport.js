export async function handler(event) {
  const q = event.queryStringParameters?.q;
  if (!q) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro q é obrigatório' }) };
  }

  const apiKey = process.env.RAPIDAPI_KEY || '84765bd38cmsh03b2568c9aa4a0fp1867f6jsnd28a64117f8b';
  const apiHost = process.env.RAPIDAPI_HOST || 'aerodatabox.p.rapidapi.com';

  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': apiHost
  };

  const isIcao = /^[A-Za-z]{4}$/.test(q);
  const endpoint = isIcao
    ? `https://${apiHost}/airports/icao/${q.toUpperCase()}`
    : `https://${apiHost}/airports/search/term?q=${encodeURIComponent(q)}&limit=1`;

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: text }) };
    }
    const data = await res.json();

    const record = isIcao ? data : data.items && data.items[0];
    if (!record) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Aeroporto não encontrado' }) };
    }

    const loc = record.location || {};
    const lat = Number(loc.lat ?? loc.latitude);
    const lon = Number(loc.lon ?? loc.longitude);
    if (lat == null || lon == null) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Aeroporto sem coordenadas' }) };
    }

    const result = {
      icao: record.icao || record.icaoCode || q.toUpperCase(),
      name: record.name || record.municipalityName || 'N/A',
      lat,
      lon
    };

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
