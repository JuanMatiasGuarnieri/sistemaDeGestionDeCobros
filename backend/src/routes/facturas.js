const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { facturas, clientes } = require('../models/data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function findOrCreateCliente(nombre, direccion = '', telefono = '') {
  if (!nombre) return null;

  let cliente = clientes.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());

  if (!cliente) {
    cliente = {
      id: uuidv4(),
      nombre,
      direccion,
      telefono,
      email: '',
      plan: '',
      montoMensual: 0,
      activo: true,
      createdAt: new Date().toISOString(),
    };
    clientes.push(cliente);
  }

  return cliente;
}

router.get('/', authMiddleware, (req, res) => {
  const { mes, estado } = req.query;

  let filtered = [...facturas];

  if (mes) {
    filtered = filtered.filter(f => f.mes === mes);
  }

  if (estado) {
    filtered = filtered.filter(f => f.estado === estado);
  }

  const today = new Date().toISOString().split('T')[0];
  filtered = filtered.map(f => {
    if (f.estado === 'pendiente' && f.fechaVencimiento < today) {
      f.estado = 'vencida';
    }
    return f;
  });

  res.json(filtered);
});

router.get('/:id', authMiddleware, (req, res) => {
  const factura = facturas.find(f => f.id === req.params.id);
  if (!factura) {
    return res.status(404).json({ message: 'Factura no encontrada' });
  }
  res.json(factura);
});

router.post('/', authMiddleware, (req, res) => {
  const { numero, clienteId, clienteNombre, direccion, monto, fechaEmision, fechaVencimiento, observaciones, mes } = req.body;

  if (!numero || !monto) {
    return res.status(400).json({ message: 'Número y monto son requeridos' });
  }

  let cliente = null;

  if (clienteId) {
    cliente = clientes.find(c => c.id === clienteId);
  } else if (clienteNombre) {
    cliente = findOrCreateCliente(clienteNombre, direccion);
  }

  const today = new Date().toISOString().split('T')[0];
  let estado = 'pendiente';
  if (fechaVencimiento && fechaVencimiento < today) {
    estado = 'vencida';
  }

  const nuevaFactura = {
    id: uuidv4(),
    numero,
    clienteId: cliente?.id || null,
    cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : null,
    direccion: direccion || cliente?.direccion || '',
    monto: parseFloat(monto),
    fechaEmision: fechaEmision || today,
    fechaVencimiento: fechaVencimiento || '',
    estado,
    mes: mes || new Date().toISOString().slice(0, 7),
    observaciones: observaciones || '',
    createdAt: new Date().toISOString(),
    creadoPor: req.user.id,
  };

  facturas.push(nuevaFactura);
  res.status(201).json(nuevaFactura);
});

router.put('/:id', authMiddleware, (req, res) => {
  const index = facturas.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Factura no encontrada' });
  }

  const { numero, clienteId, direccion, monto, fechaEmision, fechaVencimiento, observaciones, mes } = req.body;
  const cliente = clienteId ? clientes.find(c => c.id === clienteId) : null;

  const today = new Date().toISOString().split('T')[0];
  let estado = facturas[index].estado;
  if (fechaVencimiento && fechaVencimiento < today && estado === 'pendiente') {
    estado = 'vencida';
  }

  facturas[index] = {
    ...facturas[index],
    numero: numero || facturas[index].numero,
    clienteId: clienteId !== undefined ? clienteId : facturas[index].clienteId,
    cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : facturas[index].cliente,
    direccion: direccion !== undefined ? direccion : facturas[index].direccion,
    monto: monto !== undefined ? parseFloat(monto) : facturas[index].monto,
    fechaEmision: fechaEmision || facturas[index].fechaEmision,
    fechaVencimiento: fechaVencimiento !== undefined ? fechaVencimiento : facturas[index].fechaVencimiento,
    estado,
    mes: mes || facturas[index].mes,
    observaciones: observaciones !== undefined ? observaciones : facturas[index].observaciones,
  };

  res.json(facturas[index]);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const index = facturas.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Factura no encontrada' });
  }

  facturas.splice(index, 1);
  res.json({ message: 'Factura eliminada correctamente' });
});

router.post('/importar', authMiddleware, (req, res) => {
  const { facturas: facturasData } = req.body;

  if (!facturasData || !Array.isArray(facturasData)) {
    return res.status(400).json({ message: 'Datos de facturas inválidos' });
  }

  const nuevasFacturas = [];
  const clientesNuevos = [];
  const today = new Date().toISOString().split('T')[0];
  const currentMes = new Date().toISOString().slice(0, 7);

  facturasData.forEach(data => {
    const nombreCliente = data.cliente || '';
    const direccionCliente = data.direccion || '';

    const cliente = nombreCliente ? findOrCreateCliente(nombreCliente, direccionCliente) : null;

    if (cliente && !clientesNuevos.find(c => c.id === cliente.id) && clientes.find(c => c.id !== cliente.id)) {
      const originalIndex = clientes.findIndex(c => c.id === cliente.id);
      if (originalIndex === -1) {
        clientesNuevos.push({ nombre: cliente.nombre });
      }
    }

    let estado = 'pendiente';
    const fechaVenc = data.fechaVencimiento || data.fecha || today;
    if (fechaVenc < today) {
      estado = 'vencida';
    }

    const nuevaFactura = {
      id: uuidv4(),
      numero: data.numero || `FAC-${Date.now()}`,
      clienteId: cliente?.id || null,
      cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : { nombre: nombreCliente || '' },
      direccion: data.direccion || cliente?.direccion || '',
      monto: parseFloat(data.monto) || 0,
      fechaEmision: data.fechaEmision || data.fecha || today,
      fechaVencimiento: fechaVenc,
      estado,
      mes: data.mes || currentMes,
      observaciones: data.observaciones || '',
      createdAt: new Date().toISOString(),
      creadoPor: req.user.id,
    };

    facturas.push(nuevaFactura);
    nuevasFacturas.push(nuevaFactura);
  });

  const clientesRegistrados = nuevasFacturas.filter(f => f.clienteId).length;
  const mensaje = clientesNuevos.length > 0
    ? `Se importaron ${nuevasFacturas.length} facturas y se registraron ${clientesNuevos.length} nuevos clientes`
    : `Se importaron ${nuevasFacturas.length} facturas`;

  res.status(201).json({ message: mensaje, facturas: nuevasFacturas, clientesRegistrados });
});

module.exports = router;