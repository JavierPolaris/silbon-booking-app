import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import timifyRoutes from './routes/timify.js';

dotenv.config();

console.log("✅ ENV APP ID:", process.env.TIMIFY_APP_ID);
console.log("✅ ENV APP SECRET:", process.env.TIMIFY_APP_SECRET?.slice(0, 5) + "...");
console.log("✅ ENV ENTERPRISE ID:", process.env.TIMIFY_ENTERPRISE_ID);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/timify', timifyRoutes);

app.get('/', (req, res) => {
  res.send('🧩 Silbon Booking App corriendo!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
