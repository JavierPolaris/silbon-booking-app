// api/cron-upload.js
import { uploadJsonToOneLake } from '../src/uploadToOneLake.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const url = `${protocol}://${host}/api/get-all-appointments`;

    const response = await fetch(url);
    const data = await response.json();

    const fileName = `appointments-${new Date().toISOString().split('T')[0]}.json`;

    await uploadJsonToOneLake(data, fileName);

    res.status(200).json({ message: 'Citas subidas correctamente a OneLake 🚀', file: fileName });
  } catch (err) {
    console.error('❌ Error en cron-upload:', err);
    res.status(500).json({ error: 'Error en cron-upload', details: err.message });
  }
}
