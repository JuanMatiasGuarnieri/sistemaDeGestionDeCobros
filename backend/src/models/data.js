const { v4: uuidv4 } = require('uuid');

const usuarios = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: '$2a$10$xJwK5L5VFZ5Q8VqN3Q5Y5OF5Y5O5Y5O5Y5O5Y5O5Y5O5Y5O5Y5O',
    nombre: 'Administrador',
    rol: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'cobrador@demo.com',
    password: '$2a$10$xJwK5L5VFZ5Q8VqN3Q5Y5OF5Y5O5Y5O5Y5O5Y5O5Y5O5Y5O5Y5O',
    nombre: 'Juan Cobrador',
    rol: 'cobrador',
    createdAt: new Date().toISOString(),
  },
];

const clientes = [
  {
    id: '1',
    nombre: 'Empresa ABC',
    direccion: 'Av. Principal 123',
    telefono: '3511234567',
    email: 'contacto@abc.com',
    plan: 'Premium',
    montoMensual: 5000,
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Tech Solutions',
    direccion: 'Calle 45 678',
    telefono: '3519876543',
    email: 'admin@techsol.com',
    plan: 'Básico',
    montoMensual: 2500,
    activo: true,
    createdAt: new Date().toISOString(),
  },
];

const facturas = [
  {
    id: '1',
    numero: 'FAC-001',
    clienteId: '1',
    cliente: { id: '1', nombre: 'Empresa ABC' },
    direccion: 'Av. Principal 123',
    monto: 5000,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'pendiente',
    mes: new Date().toISOString().slice(0, 7),
    observaciones: '',
    createdAt: new Date().toISOString(),
    creadoPor: '1',
  },
  {
    id: '2',
    numero: 'FAC-002',
    clienteId: '2',
    cliente: { id: '2', nombre: 'Tech Solutions' },
    direccion: 'Calle 45 678',
    monto: 2500,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'vencida',
    mes: new Date().toISOString().slice(0, 7),
    observaciones: '',
    createdAt: new Date().toISOString(),
    creadoPor: '1',
  },
];

const cobros = [
  {
    id: '1',
    facturaId: '1',
    montoCobrado: 5000,
    fechaCobro: new Date().toISOString().split('T')[0],
    metodo: 'transferencia',
    cobradorId: '2',
    cobrador: { id: '2', nombre: 'Juan Cobrador' },
    observaciones: 'Pago realizado',
    createdAt: new Date().toISOString(),
  },
];

module.exports = {
  usuarios,
  clientes,
  facturas,
  cobros,
};