import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import timifyRoutes from './routes/timify.js';

dotenv.config();

console.log("🧪 ENV CLIENT ID:", process.env.TIMIFY_CLIENT_ID);
console.log("🧪 ENV CLIENT SECRET:", process.env.TIMIFY_CLIENT_SECRET?.slice(0, 5) + "...");

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
