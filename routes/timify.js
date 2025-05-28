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


// 1) Sucursales + servicios
router.get('/public-branches-services', async (req, res) => {
  const token = await getTimifyToken();
  const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;
  const { data } = await axios.get(
    'https://api.timify.com/v1/booker-services/companies',
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      params: { enterprise_id: enterpriseId, with_full_attributes: false }
    }
  );
  res.json(data.companies);
});

// 2) Disponibilidad pública
router.get('/public-availability', async (req, res) => {
  const { companyId, serviceId } = req.query;
  const token = await getTimifyToken();
  const { data } = await axios.get(
    'https://api.timify.com/v1/booker-services/availabilities',
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      params: { company_id: companyId, service_id: serviceId }
    }
  );
  res.json(data);
});







export default router;
