const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { clientes } = require('../models/data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.json(clientes);
});

router.get('/:id', authMiddleware, (req, res) => {
  const cliente = clientes.find(c => c.id === req.params.id);
  if (!cliente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }
  res.json(cliente);
});

router.post('/', authMiddleware, (req, res) => {
  const { nombre, direccion, telefono, email, plan, montoMensual, activo } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre es requerido' });
  }

  const nuevoCliente = {
    id: uuidv4(),
    nombre,
    direccion: direccion || '',
    telefono: telefono || '',
    email: email || '',
    plan: plan || '',
    montoMensual: montoMensual || 0,
    activo: activo !== undefined ? activo : true,
    createdAt: new Date().toISOString(),
  };

  clientes.push(nuevoCliente);
  res.status(201).json(nuevoCliente);
});

router.put('/:id', authMiddleware, (req, res) => {
  const index = clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  const { nombre, direccion, telefono, email, plan, montoMensual, activo } = req.body;

  clientes[index] = {
    ...clientes[index],
    nombre: nombre || clientes[index].nombre,
    direccion: direccion !== undefined ? direccion : clientes[index].direccion,
    telefono: telefono !== undefined ? telefono : clientes[index].telefono,
    email: email !== undefined ? email : clientes[index].email,
    plan: plan !== undefined ? plan : clientes[index].plan,
    montoMensual: montoMensual !== undefined ? montoMensual : clientes[index].montoMensual,
    activo: activo !== undefined ? activo : clientes[index].activo,
  };

  res.json(clientes[index]);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const index = clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  clientes.splice(index, 1);
  res.json({ message: 'Cliente eliminado correctamente' });
});

module.exports = router;