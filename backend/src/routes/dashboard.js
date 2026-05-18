const express = require('express');
const { facturas, cobros, clientes } = require('../models/data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, (req, res) => {
  const { mes } = req.query;

  let facturasFiltered = [...facturas];
  let cobrosFiltered = [...cobros];

  if (mes) {
    facturasFiltered = facturasFiltered.filter(f => f.mes === mes);
    const facturasDelMes = facturasFiltered.map(f => f.id);
    cobrosFiltered = cobrosFiltered.filter(c => facturasDelMes.includes(c.facturaId));
  }

  const today = new Date().toISOString().split('T')[0];
  facturasFiltered = facturasFiltered.map(f => {
    if (f.estado === 'pendiente' && f.fechaVencimiento && f.fechaVencimiento < today) {
      return { ...f, estado: 'vencida' };
    }
    return f;
  });

  const totalFacturado = facturasFiltered.reduce((sum, f) => sum + (f.monto || 0), 0);
  const totalCobrado = cobrosFiltered.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);

  const facturasCobradas = facturasFiltered.filter(f => f.estado === 'cobrada').length;
  const facturasPendientes = facturasFiltered.filter(f => f.estado === 'pendiente').length;
  const facturasVencidas = facturasFiltered.filter(f => f.estado === 'vencida').length;

  const totalFacturas = facturasFiltered.length;
  const porcentajeCobrado = totalFacturas > 0 ? Math.round((facturasCobradas / totalFacturas) * 100) : 0;
  const porcentajePendiente = totalFacturas > 0 ? Math.round((facturasPendientes / totalFacturas) * 100) : 0;
  const porcentajeVencido = totalFacturas > 0 ? Math.round((facturasVencidas / totalFacturas) * 100) : 0;

  const clientesActivos = clientes.filter(c => c.activo).length;
  const clientesNuevos = mes
    ? clientes.filter(c => c.createdAt && c.createdAt.startsWith(mes)).length
    : 0;

  const cobrosPorCobrador = {};
  cobrosFiltered.forEach(c => {
    const nombre = c.cobrador?.nombre || 'Desconocido';
    if (!cobrosPorCobrador[nombre]) {
      cobrosPorCobrador[nombre] = { nombre, total: 0, cantidad: 0 };
    }
    cobrosPorCobrador[nombre].total += c.montoCobrado || 0;
    cobrosPorCobrador[nombre].cantidad += 1;
  });

  res.json({
    totalFacturado,
    totalCobrado,
    totalPendiente: totalFacturado - totalCobrado,
    totalFacturas,
    facturasCobradas,
    facturasPendientes,
    facturasVencidas,
    porcentajeCobrado,
    porcentajePendiente,
    porcentajeVencido,
    clientesActivos,
    clientesNuevos,
    cobrosPorCobrador: Object.values(cobrosPorCobrador),
  });
});

router.get('/alerts', authMiddleware, (req, res) => {
  const today = new Date();
  const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  const todayStr = today.toISOString().split('T')[0];
  const fiveDaysStr = fiveDaysFromNow.toISOString().split('T')[0];

  const allFacturas = [...facturas].map(f => {
    if (f.estado === 'pendiente' && f.fechaVencimiento && f.fechaVencimiento < todayStr) {
      return { ...f, estado: 'vencida' };
    }
    return f;
  });

  const pendientes = allFacturas.filter(f => f.estado === 'pendiente');

  const vencidas = pendientes.filter(f => f.fechaVencimiento && f.fechaVencimiento < todayStr);
  const proximasVencer = pendientes.filter(f => f.fechaVencimiento && f.fechaVencimiento >= todayStr && f.fechaVencimiento <= fiveDaysStr);

  const alerts = [
    ...vencidas.map(f => ({ tipo: 'vencida', factura: f })),
    ...proximasVencer.map(f => ({ tipo: 'proximavencer', factura: f })),
  ];

  res.json(alerts.slice(0, 10));
});

module.exports = router;