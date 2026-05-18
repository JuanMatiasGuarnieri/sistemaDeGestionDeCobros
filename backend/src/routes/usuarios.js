const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { usuarios } = require('../models/data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const users = usuarios.map(u => ({
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { email, password, nombre, rol } = req.body;

  if (!email || !password || !nombre || !rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(400).json({ message: 'El email ya está en uso' });
  }

  if (!['admin', 'cobrador'].includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  const nuevoUsuario = {
    id: uuidv4(),
    email,
    password,
    nombre,
    rol,
    createdAt: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  res.status(201).json({
    id: nuevoUsuario.id,
    email: nuevoUsuario.email,
    nombre: nuevoUsuario.nombre,
    rol: nuevoUsuario.rol,
    createdAt: nuevoUsuario.createdAt,
  });
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const index = usuarios.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const { email, nombre, rol } = req.body;

  if (email && email !== usuarios[index].email && usuarios.find(u => u.email === email)) {
    return res.status(400).json({ message: 'El email ya está en uso' });
  }

  usuarios[index] = {
    ...usuarios[index],
    email: email || usuarios[index].email,
    nombre: nombre || usuarios[index].nombre,
    rol: rol || usuarios[index].rol,
  };

  res.json({
    id: usuarios[index].id,
    email: usuarios[index].email,
    nombre: usuarios[index].nombre,
    rol: usuarios[index].rol,
  });
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const index = usuarios.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (usuarios[index].id === req.user.id) {
    return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  }

  usuarios.splice(index, 1);
  res.json({ message: 'Usuario eliminado correctamente' });
});

module.exports = router;