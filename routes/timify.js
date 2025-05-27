import express from 'express';
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';
import { getAppToken } from '../utils/getAppToken.js';


const router = express.Router();
const TIMIFY_APP_ID = process.env.TIMIFY_APP_ID;
const TIMIFY_APP_SECRET = process.env.TIMIFY_APP_SECRET;
const ENTERPRISE_ID = process.env.TIMIFY_ENTERPRISE_ID;

router.get('/availability', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        // Reemplaza con tu companyId y serviceId reales
        const companyId = 'TU_COMPANY_ID';
        const serviceId = 'TU_SERVICE_ID';

        const response = await axios.get(
            `https://api.timify.com/v1/events/availability`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    companyId,
                    serviceId
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('❌ Error en disponibilidad:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al consultar disponibilidad' });
    }
});

router.get('/companies', async (req, res) => {
  try {
    const token = await getAppToken();
    if (!token) return res.status(500).json({ error: 'No se pudo obtener token de app' });

    const response = await axios.get('https://api.timify.com/v1/companies', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        enterprise_id: ENTERPRISE_ID
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ Error al obtener compañías:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener compañías' });
  }
});



// Obtener servicios de una compañía concreta
router.get('/services/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const response = await axios.get(
            `https://api.timify.com/v1/companies/${companyId}/services`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'company-id': companyId
                }
            }
        );


        res.json(response.data);
    } catch (error) {
        console.error('❌ Error al obtener servicios:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

router.get('/debug/token', async (req, res) => {
    try {
        const token = await getTimifyToken();
        res.json({ token }); // <-- devuelve como propiedad `token`
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




export default router;
