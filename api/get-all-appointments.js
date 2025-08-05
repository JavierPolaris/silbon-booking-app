// api/get-all-appointments.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const accessToken = token.accessToken;
    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

    console.log('🪪 token:', accessToken);
    console.log('🏢 enterpriseId:', enterpriseId);

    if (!accessToken || !enterpriseId) {
      return res.status(401).json({ error: 'Token o enterpriseId inválido' });
    }

    // 🕐 Obtener fecha del día anterior
    const timezone = 'Europe/Madrid';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateStr = yesterday.toISOString().split('T')[0];
    const from_time = `${dateStr} 00:00`;
    const to_time = `${dateStr} 23:55`; // Timify requiere múltiplos de 5

    // 🔁 Obtener companyIds de todas las sucursales
    const { data: companiesData } = await axios.get('https://api.timify.com/v1/booker-services/companies', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        enterprise_id: enterpriseId,
        with_full_attributes: true,
      },
    });

    const companyIds = companiesData.data.companyIds || [];
    const allAppointments = [];

    for (const companyId of companyIds) {
      console.log(`📍 Consultando citas para sucursal: ${companyId}`);
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await axios.get('https://api.timify.com/v1/appointments', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'company-id': companyId,
            'Content-Type': 'application/json'
          },
          params: {
            timezone,
            from_date: dateStr,
            to_date: dateStr,
            from_time,
            to_time,
            limit: 50,
            page
          }
        });

        const appointments = data.data || [];
        console.log(`📅 Página ${page} → ${appointments.length} citas`);

        allAppointments.push(
          ...appointments.map(appointment => ({
            id: appointment.id,
            start: appointment.start,
            end: appointment.end,
            customer_id: appointment.customer_id,
            service_id: appointment.service_id,
            resource_id: appointment.resource_id,
            branch_id: companyId
          }))
        );

        hasMore = appointments.length === 50;
        page++;
      }
    }

    res.status(200).json(allAppointments);
  } catch (error) {
    console.error('❌ Error al obtener citas:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al obtener citas',
      details: error.response?.data || error.message
    });
  }
}
