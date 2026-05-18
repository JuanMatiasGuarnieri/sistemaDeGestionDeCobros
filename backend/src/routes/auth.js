const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { usuarios } = require('../models/data');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const demoUsers = {
    'admin@demo.com': { id: '1', nombre: 'Administrador', rol: 'admin', password: 'admin123' },
    'cobrador@demo.com': { id: '2', nombre: 'Juan Cobrador', rol: 'cobrador', password: 'cobrador123' },
  };

  const demoUser = demoUsers[email];

  if (!demoUser || password !== demoUser.password) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: demoUser.id, email, nombre: demoUser.nombre, rol: demoUser.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: demoUser.id,
      email,
      nombre: demoUser.nombre,
      rol: demoUser.rol,
    },
  });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;