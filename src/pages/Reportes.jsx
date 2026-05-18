import { useState, useEffect } from 'react';
import api from '../services/api';
import { exportFacturasReport, exportToExcel } from '../services/excel';

export default function Reportes() {
  const [facturas, setFacturas] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));
  const [reporteTipo, setReporteTipo] = useState('resumen');

  useEffect(() => {
    loadData();
  }, [filterMes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facturasData, cobrosData] = await Promise.all([
        api.facturas.getAll({ mes: filterMes }),
        api.cobros.getAll({ mes: filterMes }),
      ]);
      setFacturas(facturasData);
      setCobros(cobrosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFacturas = () => {
    exportFacturasReport(facturas, cobros, `facturas_${filterMes}`);
  };

  const handleExportClientes = () => {
    const clienteStats = {};

    facturas.forEach(f => {
      const clienteId = f.clienteId || f.cliente?.id;
      if (!clienteStats[clienteId]) {
        clienteStats[clienteId] = {
          nombre: f.cliente?.nombre || f.cliente || 'Sin cliente',
          totalFacturado: 0,
          totalCobrado: 0,
          facturas: 0,
          cobradas: 0,
        };
      }
      clienteStats[clienteId].totalFacturado += f.monto || 0;
      clienteStats[clienteId].facturas += 1;

      const cobro = cobros.find(c => c.facturaId === f.id);
      if (cobro) {
        clienteStats[clienteId].totalCobrado += cobro.montoCobrado || 0;
        clienteStats[clienteId].cobradas += 1;
      }
    });

    const data = Object.values(clienteStats).map(c => ({
      Cliente: c.nombre,
      'Total Facturado': c.totalFacturado,
      'Total Cobrado': c.totalCobrado,
      'Pendiente': c.totalFacturado - c.totalCobrado,
      'Facturas': c.facturas,
      'Cobradas': c.cobradas,
    }));

    exportToExcel(data, `reporte_clientes_${filterMes}`, 'Por Cliente');
  };

  const handleExportCobros = () => {
    const data = cobros.map(c => ({
      Fecha: c.fechaCobro ? new Date(c.fechaCobro).toLocaleDateString('es-AR') : '-',
      Factura: c.factura?.numero || '-',
      Cliente: c.factura?.cliente?.nombre || '-',
      Monto: c.montoCobrado,
      Método: c.metodo === 'efectivo' ? 'Efectivo' : c.metodo === 'transferencia' ? 'Transferencia' : 'Otro',
      Cobrador: c.cobrador?.nombre || '-',
      Observaciones: c.observaciones || '',
    }));

    exportToExcel(data, `cobros_${filterMes}`, 'Cobros');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value || 0);
  };

  const getResumenData = () => {
    const totalFacturado = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
    const totalCobrado = cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);
    const pendientes = facturas.filter(f => f.estado !== 'cobrada');
    const vencidas = facturas.filter(f => f.estado === 'vencida');
    const cobradas = facturas.filter(f => f.estado === 'cobrada');

    return { totalFacturado, totalCobrado, pendientes, vencidas, cobradas };
  };

  const getCobrosPorMetodo = () => {
    const porMetodo = { efectivo: 0, transferencia: 0, otro: 0 };
    cobros.forEach(c => {
      porMetodo[c.metodo] = (porMetodo[c.metodo] || 0) + (c.montoCobrado || 0);
    });
    return porMetodo;
  };

  const resumen = getResumenData();
  const porMetodo = getCobrosPorMetodo();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <p className="text-gray-500">Generación de reportes y exportaciones</p>
        </div>
        <input
          type="month"
          value={filterMes}
          onChange={(e) => setFilterMes(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <button
          onClick={handleExportFacturas}
          className="card hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Reporte de Facturas</h3>
              <p className="text-sm text-gray-500">Exportar todas las facturas</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleExportClientes}
          className="card hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Reporte por Cliente</h3>
              <p className="text-sm text-gray-500">Resumen por cliente</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleExportCobros}
          className="card hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Reporte de Cobros</h3>
              <p className="text-sm text-gray-500">Exportar cobros del mes</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Mes</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Facturado</span>
              <span className="font-semibold text-gray-800">{formatCurrency(resumen.totalFacturado)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Total Cobrado</span>
              <span className="font-semibold text-green-600">{formatCurrency(resumen.totalCobrado)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-600">Pendiente</span>
              <span className="font-semibold text-yellow-600">{formatCurrency(resumen.totalFacturado - resumen.totalCobrado)}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{resumen.cobradas.length}</p>
                <p className="text-sm text-gray-500">Cobradas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{resumen.pendientes.length - resumen.vencidas.length}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{resumen.vencidas.length}</p>
                <p className="text-sm text-gray-500">Vencidas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cobros por Método</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Efectivo</span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(porMetodo.efectivo)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Transferencia</span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(porMetodo.transferencia)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Otro</span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(porMetodo.otro)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Facturas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map(factura => {
                const cobro = cobros.find(c => c.facturaId === factura.id);
                return (
                  <tr key={factura.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-gray-800">{factura.numero}</td>
                    <td className="px-4 py-3 text-gray-600">{factura.cliente?.nombre || factura.cliente}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(factura.monto)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${factura.estado === 'cobrada' ? 'badge-paid' : factura.estado === 'vencida' ? 'badge-overdue' : 'badge-pending'}`}>
                        {factura.estado === 'cobrada' ? 'Cobrada' : factura.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cobro ? formatCurrency(cobro.montoCobrado) : '-'}</td>
                  </tr>
                );
              })}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No hay facturas para el período seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}