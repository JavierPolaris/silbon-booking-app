import { uploadJsonToOneLake } from '../src/uploadToOneLake.js';
import getAppointmentsHandler from './get-all-appointments.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Simulamos una respuesta fake para capturar el JSON que devuelve get-all-appointments
    const fakeReq = { method: 'GET' };
    let data = null;

    const fakeRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(jsonData) {
        data = jsonData;
      }
    };

    await getAppointmentsHandler(fakeReq, fakeRes);

    if (!data) throw new Error('No se pudo obtener la data de las citas');

    const fileName = `appointments-${new Date().toISOString().split('T')[0]}.json`;

    await uploadJsonToOneLake(data, fileName);

    res.status(200).json({ message: 'Citas subidas correctamente a OneLake 🚀', file: fileName });
  } catch (err) {
    console.error('❌ Error en cron-upload:', err);
    res.status(500).json({ error: 'Error en cron-upload', details: err.message });
  }
}
