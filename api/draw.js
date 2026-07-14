export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tableName = process.env.SUPABASE_TABLE_NAME || 'lotto_draws';

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { numbers, sum } = body;

  const isValidNumbers =
    Array.isArray(numbers) &&
    numbers.length === 6 &&
    numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 45) &&
    new Set(numbers).size === 6;

  if (!isValidNumbers) {
    return res.status(400).json({ error: 'Invalid numbers payload.' });
  }

  const normalized = [...numbers].sort((a, b) => a - b);

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        numbers: normalized,
        sum: Number.isInteger(sum) ? sum : normalized.reduce((acc, n) => acc + n, 0),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: 'Failed to save draw to Supabase.',
        details: text,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected error while saving draw.',
      details: error.message,
    });
  }
}
