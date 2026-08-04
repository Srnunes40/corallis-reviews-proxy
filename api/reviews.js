// api/reviews.js
// Rota: https://SEU-PROJETO.vercel.app/api/reviews
// A chave da API fica só aqui no servidor, nunca no HTML.

export default async function handler(req, res) {
  // Cache de 1h pra não gastar cota à toa — ainda assim "atualiza sozinho"
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  // Libera o seu site a chamar essa API (troque pelo domínio real quando tiver)
  res.setHeader('Access-Control-Allow-Origin', '*');

  const PLACE_ID = process.env.GOOGLE_PLACE_ID;
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!PLACE_ID || !API_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas.' });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    const r = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
      }
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'Erro na Google Places API', details: errText });
    }

    const data = await r.json();

    const reviews = (data.reviews || []).map(rv => ({
      n: rv.authorAttribution?.displayName || 'Cliente Google',
      s: rv.rating || 5,
      t: rv.text?.text || '',
      d: rv.relativePublishTimeDescription || ''
    }));

    return res.status(200).json({
      rating: data.rating || null,
      total: data.userRatingCount || null,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao buscar avaliações', details: String(err) });
  }
}
