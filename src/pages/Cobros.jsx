import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Cobros() {
  const [cobros, setCobros] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));
  const [busquedaFactura, setBusquedaFactura] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    facturaId: '',
    montoCobrado: '',
    fechaCobro: new Date().toISOString().split('T')[0],
    metodo: 'efectivo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, [filterMes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cobrosData, facturasData] = await Promise.all([
        api.cobros.getAll({ mes: filterMes }),
        api.facturas.getAll({ mes: filterMes, estado: 'pendiente' }),
      ]);
      setCobros(cobrosData);
      setFacturasPendientes(facturasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.cobros.create({
        ...formData,
        montoCobrado: parseFloat(formData.montoCobrado),
      });

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando cobro:', error);
      alert('Error al registrar cobro');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cobro?')) return;

    try {
      await api.cobros.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando cobro:', error);
      alert('Error al eliminar cobro');
    }
  };

  const selectFactura = (factura) => {
    if (factura) {
      setFormData({
        ...formData,
        facturaId: factura.id,
        montoCobrado: factura.monto,
      });
      setBusquedaFactura(`${factura.numero} - ${factura.cliente?.nombre || factura.cliente}`);
      setShowSuggestions(false);
    }
  };

  const filteredSuggestions = facturasPendientes.filter(f =>
    (f.numero || '').toLowerCase().includes(busquedaFactura.toLowerCase()) ||
    (f.cliente?.nombre || f.cliente || '').toLowerCase().includes(busquedaFactura.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      facturaId: '',
      montoCobrado: '',
      fechaCobro: new Date().toISOString().split('T')[0],
      metodo: 'efectivo',
      observaciones: '',
    });
    setBusquedaFactura('');
    setShowSuggestions(false);
  };

  const filteredCobros = cobros.filter(c =>
    (c.factura?.numero || '').toLowerCase().includes('') ||
    (c.factura?.cliente?.nombre || '').toLowerCase().includes('')
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value || 0);
  };

  const getMetodoLabel = (metodo) => {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'transferencia': return 'Transferencia';
      default: return 'Otro';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cobros</h2>
          <p className="text-gray-500">Registro de cobros del mes</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Cobro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Cobrado</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0))}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Cantidad de Cobros</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{cobros.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Facturas Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{facturasPendientes.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="input-field w-auto"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Cobrador</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCobros.map((cobro) => (
                  <tr key={cobro.id} className="table-row">
                    <td className="px-4 py-3 text-gray-600">
                      {cobro.fechaCobro ? new Date(cobro.fechaCobro).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {cobro.factura?.numero || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cobro.factura?.cliente?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatCurrency(cobro.montoCobrado)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-paid">
                        {getMetodoLabel(cobro.metodo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cobro.cobrador?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(cobro.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCobros.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No se encontraron cobros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh]">
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Registrar Cobro</h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Factura *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaFactura}
                      onChange={(e) => {
                        setBusquedaFactura(e.target.value);
                        setFormData({ ...formData, facturaId: '' });
                        setShowSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowSuggestions(busquedaFactura.length > 0)}
                      placeholder="Buscar por número o nombre de cliente..."
                      className="input-field"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuggestions.map(factura => (
                        <button
                          key={factura.id}
                          type="button"
                          onClick={() => selectFactura(factura)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{factura.numero}</p>
                              <p className="text-sm text-gray-500">{factura.cliente?.nombre || factura.cliente}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-800">{formatCurrency(factura.monto)}</p>
                              <p className="text-xs text-gray-400">{factura.estado}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSuggestions && busquedaFactura && filteredSuggestions.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                      No se encontraron facturas
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.montoCobrado}
                      onChange={(e) => setFormData({ ...formData, montoCobrado: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={formData.fechaCobro}
                      onChange={(e) => setFormData({ ...formData, fechaCobro: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de cobro</label>
                  <select
                    value={formData.metodo}
                    onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
                    className="input-field"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Registrar Cobro
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}