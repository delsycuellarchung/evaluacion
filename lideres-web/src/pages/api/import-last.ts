import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request received:', req.method, req.headers);
  console.log('Request body:', req.body);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const filePath = './uploads-debug/last-import.json';
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'No local import data found' });
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (err) {
    console.error('API /api/import-last error', err);
    return res.status(500).json({ error: 'Could not read local import data' });
  }
}
