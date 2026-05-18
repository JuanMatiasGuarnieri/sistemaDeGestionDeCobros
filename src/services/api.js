import firebaseService from './firebase';

const USE_FIREBASE = true;
const API_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function fetchAPI(endpoint, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || 'Error en la solicitud');
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (email, password) => {
      if (USE_FIREBASE) {
        const result = await firebaseService.auth.login(email, password);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', 'firebase-token');
        return result;
      }
      return fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    register: (userData) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    me: async () => {
      if (USE_FIREBASE) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user;
      }
      return fetchAPI('/auth/me');
    },
    logout: async () => {
      if (USE_FIREBASE) {
        await firebaseService.auth.logout();
      }
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },

  clientes: {
    getAll: async () => {
      if (USE_FIREBASE) {
        return await firebaseService.clientes.getAll();
      }
      return fetchAPI('/clientes');
    },
    getById: async (id) => {
      if (USE_FIREBASE) {
        return await firebaseService.clientes.getById(id);
      }
      return fetchAPI(`/clientes/${id}`);
    },
    create: async (data) => {
      if (USE_FIREBASE) {
        return await firebaseService.clientes.create(data);
      }
      return fetchAPI('/clientes', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
      if (USE_FIREBASE) {
        return await firebaseService.clientes.update(id, data);
      }
      return fetchAPI(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
      if (USE_FIREBASE) {
        return await firebaseService.clientes.delete(id);
      }
      return fetchAPI(`/clientes/${id}`, { method: 'DELETE' });
    },
  },

  facturas: {
    getAll: async (params = {}) => {
      if (USE_FIREBASE) {
        return await firebaseService.facturas.getAll(params);
      }
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/facturas${query ? `?${query}` : ''}`);
    },
    getById: async (id) => {
      if (USE_FIREBASE) {
        return await firebaseService.facturas.getById(id);
      }
      return fetchAPI(`/facturas/${id}`);
    },
    create: async (data) => {
      if (USE_FIREBASE) {
        let cliente = null;
        if (data.clienteId) {
          cliente = await firebaseService.clientes.getById(data.clienteId);
        } else if (data.clienteNombre) {
          const clientes = await firebaseService.clientes.getAll();
          cliente = clientes.find(c => c.nombre.toLowerCase() === data.clienteNombre.toLowerCase());
          if (!cliente) {
            cliente = await firebaseService.clientes.create({
              nombre: data.clienteNombre,
              direccion: data.direccion || '',
              telefono: '',
              email: '',
              plan: '',
              montoMensual: data.monto || 0,
              activo: true
            });
          }
        }

        const today = new Date().toISOString().split('T')[0];
        let estado = 'pendiente';
        if (data.fechaVencimiento && data.fechaVencimiento < today) {
          estado = 'vencida';
        }

        return await firebaseService.facturas.create({
          numero: data.numero,
          clienteId: cliente?.id || null,
          cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : null,
          direccion: data.direccion || cliente?.direccion || '',
          monto: data.monto,
          fechaEmision: data.fechaEmision || today,
          fechaVencimiento: data.fechaVencimiento || '',
          estado,
          mes: data.mes || new Date().toISOString().slice(0, 7),
          observaciones: data.observaciones || ''
        });
      }
      return fetchAPI('/facturas', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
      if (USE_FIREBASE) {
        return await firebaseService.facturas.update(id, data);
      }
      return fetchAPI(`/facturas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
      if (USE_FIREBASE) {
        return await firebaseService.facturas.delete(id);
      }
      return fetchAPI(`/facturas/${id}`, { method: 'DELETE' });
    },
    importExcel: async (data) => {
      if (USE_FIREBASE) {
        const clientes = await firebaseService.clientes.getAll();
        const facturasParaCrear = [];

        for (const item of data) {
          let cliente = clientes.find(c => c.nombre.toLowerCase() === (item.cliente || '').toLowerCase());

          if (!cliente && item.cliente) {
            cliente = await firebaseService.clientes.create({
              nombre: item.cliente,
              direccion: item.direccion || '',
              telefono: '',
              email: '',
              plan: '',
              montoMensual: item.monto || 0,
              activo: true
            });
          }

          const today = new Date().toISOString().split('T')[0];
          const currentMes = new Date().toISOString().slice(0, 7);
          let estado = 'pendiente';
          if (item.fechaVencimiento && item.fechaVencimiento < today) {
            estado = 'vencida';
          }

          facturasParaCrear.push({
            numero: item.numero || `FAC-${Date.now()}`,
            clienteId: cliente?.id || null,
            cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : { nombre: item.cliente || '' },
            direccion: item.direccion || cliente?.direccion || '',
            monto: item.monto || 0,
            fechaEmision: item.fecha || today,
            fechaVencimiento: item.fechaVencimiento || '',
            estado,
            mes: item.mes || currentMes,
            observaciones: ''
          });
        }

        const results = await firebaseService.facturas.importBatch(facturasParaCrear);
        return { message: `Se importaron ${results.length} facturas`, facturas: results };
      }
      return fetchAPI('/facturas/importar', { method: 'POST', body: JSON.stringify(data) });
    },
  },

  cobros: {
    getAll: async (params = {}) => {
      if (USE_FIREBASE) {
        const cobros = await firebaseService.cobros.getAll(params);

        const facturasMap = {};
        for (const cobro of cobros) {
          if (cobro.facturaId && !facturasMap[cobro.facturaId]) {
            const factura = await firebaseService.facturas.getById(cobro.facturaId);
            if (factura) {
              facturasMap[cobro.facturaId] = factura;
            }
          }
        }

        return cobros.map(c => ({
          ...c,
          factura: facturasMap[c.facturaId] || null
        }));
      }
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/cobros${query ? `?${query}` : ''}`);
    },
    create: async (data) => {
      if (USE_FIREBASE) {
        const factura = await firebaseService.facturas.getById(data.facturaId);

        return await firebaseService.cobros.create({
          facturaId: data.facturaId,
          montoCobrado: data.montoCobrado,
          fechaCobro: data.fechaCobro,
          metodo: data.metodo || 'efectivo',
          cobradorId: data.cobradorId || 'current',
          observaciones: data.observaciones || ''
        });
      }
      return fetchAPI('/cobros', { method: 'POST', body: JSON.stringify(data) });
    },
    delete: async (id) => {
      if (USE_FIREBASE) {
        return await firebaseService.cobros.delete(id);
      }
      return fetchAPI(`/cobros/${id}`, { method: 'DELETE' });
    },
  },

  dashboard: {
    stats: async (params = {}) => {
      if (USE_FIREBASE) {
        return await firebaseService.dashboard.stats(params.mes);
      }
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/dashboard/stats${query ? `?${query}` : ''}`);
    },
    alerts: async () => {
      if (USE_FIREBASE) {
        return await firebaseService.dashboard.alerts();
      }
      return fetchAPI('/dashboard/alerts');
    },
  },

  usuarios: {
    getAll: () => fetchAPI('/usuarios'),
    create: (data) => fetchAPI('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/usuarios/${id}`, { method: 'DELETE' }),
  },
};

export default api;