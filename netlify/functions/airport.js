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

  async function fetchJson(url) {
    const r = await fetch(url, { headers });
    if (!r.ok) return { ok: false, status: r.status, text: await r.text() };
    return { ok: true, json: await r.json() };
  }

  try {
    let record = null;

    if (isIcao) {
      const direct = await fetchJson(`https://${apiHost}/airports/icao/${q.toUpperCase()}`);
      if (direct.ok) {
        record = direct.json;
      } else if (direct.status !== 404) {
        return { statusCode: direct.status, body: JSON.stringify({ error: direct.text }) };
      }
      if (!record) {
        const fallback = await fetchJson(`https://${apiHost}/airports/search/term?q=${encodeURIComponent(q)}&limit=1`);
        if (!fallback.ok) {
          return { statusCode: fallback.status, body: JSON.stringify({ error: fallback.text }) };
        }
        record = fallback.json.items && fallback.json.items[0];
      }
    } else {
      const search = await fetchJson(`https://${apiHost}/airports/search/term?q=${encodeURIComponent(q)}&limit=1`);
      if (!search.ok) {
        return { statusCode: search.status, body: JSON.stringify({ error: search.text }) };
      }
      record = search.json.items && search.json.items[0];
      if (!record && /^[A-Za-z]{4}$/.test(q)) {
        const direct = await fetchJson(`https://${apiHost}/airports/icao/${q.toUpperCase()}`);
        if (!direct.ok) {
          return { statusCode: direct.status, body: JSON.stringify({ error: direct.text }) };
        }
        record = direct.json;
      }
    }

    if (!record) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Aeroporto não encontrado' }) };
    }

    const loc = record.location || {};
    const rawLat = loc.lat ?? loc.latitude;
    const rawLon = loc.lon ?? loc.longitude;
    const lat = rawLat != null ? Number(rawLat.toString().replace(',', '.')) : null;
    const lon = rawLon != null ? Number(rawLon.toString().replace(',', '.')) : null;
    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
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
