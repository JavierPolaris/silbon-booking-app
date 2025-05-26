import express from 'express';
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

const router = express.Router();

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
    const token = await getTimifyToken();
    if (!token) return res.status(500).json({ error: 'Token error' });

    const response = await axios.get('https://api.timify.com/v1/companies', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        enterprise_id: '68341fe7cadd8241591d1037' // tu mismo App ID (por probar)
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
                    Authorization: `Bearer ${token}`
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


router.get('/my-companies', async (req, res) => {
  try {
    const token = await getTimifyToken();
    if (!token) return res.status(500).json({ error: 'Token error' });

    const response = await axios.post(
      'https://api.timify.com/v1/graphql',
      {
        query: `
          query {
            getAppCompanies {
              id
              name
              enterpriseId
              settings {
                companyName
              }
            }
          }
        `
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data.data.getAppCompanies);
  } catch (error) {
    console.error('❌ Error al obtener getAppCompanies:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener compañías' });
  }
});


export default router;
