import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { parseExcelFile } from '../services/excel';
import { processTableOCR } from '../services/ocr';

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));
  const fileInputRef = useRef(null);
  const ocrFileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    numero: '',
    clienteId: '',
    clienteNombre: '',
    direccion: '',
    monto: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, [filterMes, filterEstado]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facturasData, clientesData] = await Promise.all([
        api.facturas.getAll({ mes: filterMes, estado: filterEstado }),
        api.clientes.getAll(),
      ]);
      setFacturas(facturasData);
      setClientes(clientesData.filter(c => c.activo));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        numero: formData.numero,
        clienteId: formData.clienteId || null,
        clienteNombre: formData.clienteNombre || null,
        direccion: formData.direccion,
        monto: parseFloat(formData.monto) || 0,
        fechaEmision: formData.fechaEmision,
        fechaVencimiento: formData.fechaVencimiento,
        observaciones: formData.observaciones,
        mes: filterMes,
      };

      if (editingFactura) {
        await api.facturas.update(editingFactura.id, dataToSend);
      } else {
        const response = await api.facturas.create(dataToSend);
        if (response.cliente && response.cliente.id) {
          alert(`Factura creada. Cliente "${response.cliente.nombre}" registrado automáticamente.`);
        }
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar factura');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      await api.facturas.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando factura:', error);
      alert('Error al eliminar factura');
    }
  };

  const openEdit = (factura) => {
    setEditingFactura(factura);
    setFormData({
      numero: factura.numero,
      clienteId: factura.clienteId || '',
      direccion: factura.direccion || '',
      monto: factura.monto,
      fechaEmision: factura.fechaEmision?.split('T')[0] || '',
      fechaVencimiento: factura.fechaVencimiento?.split('T')[0] || '',
      observaciones: factura.observaciones || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingFactura(null);
    setFormData({
      numero: '',
      clienteId: '',
      clienteNombre: '',
      direccion: '',
      monto: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      observaciones: '',
    });
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseExcelFile(file);

      const facturasData = data.map(item => ({
        numero: item.numero || `FAC-${Date.now()}`,
        cliente: item.cliente || '',
        direccion: item.direccion || '',
        monto: item.monto || 0,
        fechaEmision: item.fecha || new Date().toISOString().split('T')[0],
        mes: filterMes,
      }));

      await api.facturas.importExcel(facturasData);
      setShowImportModal(false);
      loadData();
      alert(`Se importaron ${facturasData.length} facturas`);
    } catch (error) {
      console.error('Error importando Excel:', error);
      alert('Error al importar archivo: ' + error.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleOCRImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await processTableOCR(file);

      const facturasData = data.map(item => ({
        numero: item.numero || `FAC-${Date.now()}`,
        cliente: item.cliente || '',
        direccion: item.direccion || '',
        monto: item.monto || 0,
        fechaEmision: item.fecha || new Date().toISOString().split('T')[0],
        mes: filterMes,
      }));

      await api.facturas.importExcel(facturasData);
      setShowOCRModal(false);
      loadData();
      alert(`Se procesaron ${facturasData.length} facturas`);
    } catch (error) {
      console.error('Error procesando OCR:', error);
      alert('Error al procesar imagen: ' + error.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const filteredFacturas = facturas.filter(f =>
    (f.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cliente?.nombre || f.cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value || 0);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'cobrada':
        return 'badge-paid';
      case 'vencida':
        return 'badge-overdue';
      default:
        return 'badge-pending';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Facturas</h2>
          <p className="text-gray-500 mt-1">Gestión de facturas del mes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar Excel
          </button>
          <button
            onClick={() => setShowOCRModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Escanear
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-200 hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Factura
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-xs"
          />
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="input-field w-auto"
          />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="cobrada">Cobrada</option>
            <option value="vencida">Vencida</option>
          </select>
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
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Emisión</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.map((factura) => (
                  <tr key={factura.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {factura.numero}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{factura.cliente?.nombre || factura.cliente}</p>
                        {factura.direccion && (
                          <p className="text-sm text-gray-500">{factura.direccion}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatCurrency(factura.monto)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {factura.fechaEmision ? new Date(factura.fechaEmision).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getEstadoBadge(factura.estado)}`}>
                        {factura.estado === 'cobrada' ? 'Cobrada' : factura.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(factura)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(factura.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFacturas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No se encontraron facturas
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh]">
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingFactura ? 'Editar Factura' : 'Nueva Factura'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, clienteNombre: '' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.clienteNombre}
                    onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value, clienteId: '' })}
                    placeholder="Escribir nombre del cliente (se registrará automáticamente si no existe)"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                      className="input-field"
                    />
                  </div>
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
                    {editingFactura ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Importar desde Excel</h3>
              <button onClick={() => setShowImportModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Formato esperado:</strong> El archivo debe tener columnas para: número, cliente, dirección, monto, fecha.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-gray-600"
              >
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="block text-sm">Seleccionar archivo Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showOCRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Escanear tabla impresa</h3>
              <button onClick={() => setShowOCRModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Nota:</strong> El OCR funciona mejor con tablas impresas con filas y columnas bien definidas.
                  Después de escanear, podrás revisar y corregir los datos antes de importar.
                </p>
              </div>

              <input
                ref={ocrFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleOCRImport}
                className="hidden"
              />

              <button
                onClick={() => ocrFileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-gray-600"
              >
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="block text-sm">Capturar o subir imagen</span>
              </button>

              <p className="text-xs text-gray-500 text-center">
                Límite: 20 hojas/mes (API gratuita)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}