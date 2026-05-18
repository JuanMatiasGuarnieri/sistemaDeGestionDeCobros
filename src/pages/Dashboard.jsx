import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadDashboard();
  }, [mesActual]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, alertsData] = await Promise.all([
        api.dashboard.stats({ mes: mesActual }),
        api.dashboard.alerts()
      ]);
      setStats(statsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value || 0);
  };

  const getMonthName = (mes) => {
    const [year, month] = mes.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resumen del Mes</h2>
          <p className="text-gray-500 mt-1">Panel de control general</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="month"
            value={mesActual}
            onChange={(e) => setMesActual(e.target.value)}
            className="border-0 focus:ring-0 text-sm font-medium text-gray-700 bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{stats?.totalFacturas || 0}</span>
          </div>
          <p className="text-sm text-gray-500">Total Facturado</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats?.totalFacturado)}</p>
        </div>

        <div className="card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stats?.facturasCobradas || 0}</span>
          </div>
          <p className="text-sm text-gray-500">Total Cobrado</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats?.totalCobrado)}</p>
        </div>

        <div className="card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{stats?.facturasPendientes || 0}</span>
          </div>
          <p className="text-sm text-gray-500">Pendiente</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(stats?.totalPendiente)}</p>
        </div>

        <div className="card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-full">+{stats?.clientesNuevos || 0}</span>
          </div>
          <p className="text-sm text-gray-500">Clientes Activos</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.clientesActivos || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Estado de Facturas</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Cobradas</span>
              <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span>
              <span>Pendientes</span>
              <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span>
              <span>Vencidas</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Cobradas</span>
                <span className="text-sm font-bold text-gray-800">{stats?.facturasCobradas || 0} ({stats?.porcentajeCobrado || 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats?.porcentajeCobrado || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Pendientes</span>
                <span className="text-sm font-bold text-gray-800">{stats?.facturasPendientes || 0} ({stats?.porcentajePendiente || 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats?.porcentajePendiente || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Vencidas</span>
                <span className="text-sm font-bold text-gray-800">{stats?.facturasVencidas || 0} ({stats?.porcentajeVencido || 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-red-400 to-red-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats?.porcentajeVencido || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Cobros por Cobrador</h3>
          <div className="space-y-4">
            {stats?.cobrosPorCobrador?.map((cobrador, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {cobrador.nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{cobrador.nombre}</p>
                  <p className="text-sm text-gray-500">{cobrador.cantidad} cobros</p>
                </div>
                <p className="font-bold text-gray-800">{formatCurrency(cobrador.total)}</p>
              </div>
            ))}
            {(!stats?.cobrosPorCobrador || stats.cobrosPorCobrador.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No hay cobros registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card border-l-4 border-l-amber-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Alertas</h3>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl ${
                  alert.tipo === 'vencida'
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${alert.tipo === 'vencida' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                    <div>
                      <p className="font-medium text-gray-800">
                        Factura #{alert.factura?.numero}
                      </p>
                      <p className="text-sm text-gray-500">
                        {alert.factura?.cliente?.nombre || 'Sin cliente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(alert.factura?.monto)}</p>
                    <p className={`text-xs ${alert.tipo === 'vencida' ? 'text-red-600' : 'text-amber-600'}`}>
                      {alert.tipo === 'vencida' ? 'Vencida' : 'Próxima a vencer'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}