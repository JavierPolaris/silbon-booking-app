import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getTimifyToken } from '../utils/getToken.js';

dotenv.config();
const router = express.Router();


// ✅ RUTA PARA TESTEAR AUTENTICACIÓN SEGÚN DOCUMENTACIÓN
router.get('/test-auth', async (req, res) => {
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://api.timify.com/v1/auth/token',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            data: {
                appid: process.env.TIMIFY_CLIENT_ID,
                appsecret: process.env.TIMIFY_CLIENT_SECRET
            }
        });

        console.log("✅ Token recibido:", response.data);
        res.json(response.data);
    } catch (err) {
        console.error("❌ Error al obtener token:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
});

// DEBUG TOKEN
router.get('/debug/token', async (req, res) => {
    try {
        const token = await getTimifyToken();
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// EMPRESAS
router.get('/companies', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

        const response = await axios.get('https://api.timify.com/v1/companies', {
            headers: {
                accept: 'application/json',
                authorization: token
            },
            params: {
                enterprise_id: enterpriseId
            }
        });

        const companies = response.data?.data?.map(c => ({
            id: c.id,
            name: c.name,
            email: c.contactEmail,
            phone: c.phone?.phone,
            city: c.address?.city || '',
            address: c.address?.formatted || '',
            isOnline: c.onlineStatus?.isOnline,
            timezone: c.timezone
        })) || [];

        res.json(companies);
    } catch (error) {
        console.error('❌ Error al obtener compañías:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener compañías' });
    }
});



// RUTA: Servicios públicos por tienda desde booker-services
router.get('/public-services', async (req, res) => {
  try {
    const token = await getTimifyToken();

    if (!token || !token.accessToken) {
      console.log("⚠️ No hay token disponible");
      return res.status(500).json({ error: 'Token error' });
    }

    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

    const response = await axios.get(
      `https://api.timify.com/v1/booker-services/enterprise`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token.accessToken}`
        },
        params: {
          enterprise_id: enterpriseId
        }
      }
    );

    return res.json(response.data);

  } catch (err) {
    console.error('❌ Error al obtener servicios públicos:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});




// DISPONIBILIDAD
router.get('/availability', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const companyId = '67ea6b6d7ea2f9dc58cf9bef';
        const serviceId = '67eabf4d7ea2f9dc58cf9f0b';

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

// SERVICIOS
router.get('/services', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const response = await axios.get(
            `https://api.timify.com/v1/services`,
            {
                headers: {
                    accept: 'application/json',
                    authorization: token
                },
                params: {
                    sort: 'name',
                    sort_type: 'asc',
                    with_full_attributes: false
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('❌ Error al obtener servicios:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});



// SERVICIOS POR TIENDA
router.get('/services/:companyId', async (req, res) => {
  const { companyId } = req.params;
  const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

  if (!enterpriseId) {
    return res.status(400).json({ error: 'enterprise_id no proporcionado' });
  }

  try {
    const token = await getTimifyToken();
    if (!token || !token.accessToken) {
      return res.status(500).json({ error: 'Token error' });
    }

    const apiRes = await axios.get(
      `https://api.timify.com/api/booking/service?enterpriseId=${enterpriseId}&locationId=${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        }
      }
    );

    // Devolvemos directamente los servicios
    return res.json({ services: apiRes.data.data });

  } catch (err) {
    console.error('❌ Error al obtener servicios:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Error al obtener servicios' });
  }
});








export default router;
