const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { cobros, facturas, usuarios } = require('../models/data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { mes } = req.query;

  let filtered = [...cobros];

  if (mes) {
    const facturasDelMes = facturas.filter(f => f.mes === mes).map(f => f.id);
    filtered = filtered.filter(c => facturasDelMes.includes(c.facturaId));
  }

  filtered = filtered.map(c => {
    const factura = facturas.find(f => f.id === c.facturaId);
    return {
      ...c,
      factura: factura ? {
        ...factura,
        cliente: factura.cliente,
      } : null,
    };
  });

  res.json(filtered);
});

router.post('/', authMiddleware, (req, res) => {
  const { facturaId, montoCobrado, fechaCobro, metodo, observaciones } = req.body;

  if (!facturaId || !montoCobrado || !fechaCobro) {
    return res.status(400).json({ message: 'Factura, monto y fecha son requeridos' });
  }

  const factura = facturas.find(f => f.id === facturaId);
  if (!factura) {
    return res.status(404).json({ message: 'Factura no encontrada' });
  }

  const cobrador = usuarios.find(u => u.id === req.user.id);

  const nuevoCobro = {
    id: uuidv4(),
    facturaId,
    montoCobrado: parseFloat(montoCobrado),
    fechaCobro,
    metodo: metodo || 'efectivo',
    cobradorId: req.user.id,
    cobrador: cobrador ? { id: cobrador.id, nombre: cobrador.nombre } : null,
    observaciones: observaciones || '',
    createdAt: new Date().toISOString(),
  };

  cobros.push(nuevoCobro);

  const facturaIndex = facturas.findIndex(f => f.id === facturaId);
  if (facturaIndex !== -1) {
    facturas[facturaIndex].estado = 'cobrada';
  }

  res.status(201).json(nuevoCobro);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const index = cobros.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Cobro no encontrado' });
  }

  const cobro = cobros[index];
  const facturaIndex = facturas.findIndex(f => f.id === cobro.facturaId);
  if (facturaIndex !== -1) {
    const today = new Date().toISOString().split('T')[0];
    const fechaVenc = facturas[facturaIndex].fechaVencimiento;
    facturas[facturaIndex].estado = fechaVenc && fechaVenc < today ? 'vencida' : 'pendiente';
  }

  cobros.splice(index, 1);
  res.json({ message: 'Cobro eliminado correctamente' });
});

module.exports = router;