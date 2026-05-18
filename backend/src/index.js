require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const facturaRoutes = require('./routes/facturas');
const cobroRoutes = require('./routes/cobros');
const dashboardRoutes = require('./routes/dashboard');
const usuarioRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/cobros', cobroRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});