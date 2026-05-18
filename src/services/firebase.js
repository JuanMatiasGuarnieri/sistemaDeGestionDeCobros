import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBluOvxar6l7hUaGDHS5bKPu7tZDuu0SZ8",
  authDomain: "sistemadegestioncobros.firebaseapp.com",
  projectId: "sistemadegestioncobros",
  storageBucket: "sistemadegestioncobros.firebasestorage.app",
  messagingSenderId: "879088423571",
  appId: "1:879088423571:web:c54c64d7398d6bfeab7366",
  measurementId: "G-QF3P4EJSBK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const firebaseService = {
  auth: {
    login: async (email, password) => {
      // Credenciales de demo para testing sin Firebase Auth
      const demoUsers = {
        'admin@demo.com': { id: 'demo-admin', nombre: 'Administrador', rol: 'admin', password: 'admin123' },
        'cobrador@demo.com': { id: 'demo-cobrador', nombre: 'Juan Cobrador', rol: 'cobrador', password: 'cobrador123' },
      };

      const demoUser = demoUsers[email];
      if (demoUser && demoUser.password === password) {
        console.log('Login demo exitoso:', demoUser);
        return { user: demoUser };
      }

      // Si no es usuario demo, intentar con Firebase Auth real
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
          user: {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            nombre: userCredential.user.displayName || email.split('@')[0],
            rol: 'admin'
          }
        };
      } catch (authError) {
        console.error('Firebase auth error:', authError.message);
        throw new Error('Credenciales inválidas');
      }
    },
    logout: async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.log('Logout local');
      }
    }
  },

  clientes: {
    getAll: async () => {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getById: async (id) => {
      const docSnap = await getDoc(doc(db, 'clientes', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    },
    create: async (data) => {
      const docRef = doc(collection(db, 'clientes'));
      await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
      return { id: docRef.id, ...data };
    },
    update: async (id, data) => {
      await updateDoc(doc(db, 'clientes', id), data);
      return { id, ...data };
    },
    delete: async (id) => {
      await deleteDoc(doc(db, 'clientes', id));
    }
  },

  facturas: {
    getAll: async (filters = {}) => {
      let q = collection(db, 'facturas');

      const constraints = [];
      if (filters.mes) {
        constraints.push(where('mes', '==', filters.mes));
      }
      if (filters.estado) {
        constraints.push(where('estado', '==', filters.estado));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));
      let facturas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const today = new Date().toISOString().split('T')[0];
      facturas = facturas.map(f => {
        if (f.estado === 'pendiente' && f.fechaVencimiento && f.fechaVencimiento < today) {
          return { ...f, estado: 'vencida' };
        }
        return f;
      });

      return facturas;
    },
    getById: async (id) => {
      const docSnap = await getDoc(doc(db, 'facturas', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    },
    create: async (data) => {
      const docRef = doc(collection(db, 'facturas'));
      await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
      return { id: docRef.id, ...data };
    },
    update: async (id, data) => {
      await updateDoc(doc(db, 'facturas', id), data);
      return { id, ...data };
    },
    delete: async (id) => {
      await deleteDoc(doc(db, 'facturas', id));
    },
    importBatch: async (facturas) => {
      const results = [];
      for (const data of facturas) {
        const docRef = doc(collection(db, 'facturas'));
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
        results.push({ id: docRef.id, ...data });
      }
      return results;
    }
  },

  cobros: {
    getAll: async (filters = {}) => {
      let q = collection(db, 'cobros');

      const constraints = [];
      if (filters.mes) {
        constraints.push(where('mes', '==', filters.mes));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    create: async (data) => {
      const docRef = doc(collection(db, 'cobros'));
      await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });

      const factura = await getDoc(doc(db, 'facturas', data.facturaId));
      if (factura.exists()) {
        await updateDoc(doc(db, 'facturas', data.facturaId), { estado: 'cobrada' });
      }

      return { id: docRef.id, ...data };
    },
    delete: async (id) => {
      await deleteDoc(doc(db, 'cobros', id));
    }
  },

  dashboard: {
    stats: async (mes) => {
      const facturas = await firebaseService.facturas.getAll({ mes });
      const cobros = await firebaseService.cobros.getAll({ mes });

      const totalFacturado = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
      const totalCobrado = cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);

      const facturasCobradas = facturas.filter(f => f.estado === 'cobrada').length;
      const facturasPendientes = facturas.filter(f => f.estado === 'pendiente').length;
      const facturasVencidas = facturas.filter(f => f.estado === 'vencida').length;

      const totalFacturas = facturas.length;
      const porcentajeCobrado = totalFacturas > 0 ? Math.round((facturasCobradas / totalFacturas) * 100) : 0;

      const clientes = await firebaseService.clientes.getAll();
      const clientesActivos = clientes.filter(c => c.activo).length;

      return {
        totalFacturado,
        totalCobrado,
        totalPendiente: totalFacturado - totalCobrado,
        totalFacturas,
        facturasCobradas,
        facturasPendientes,
        facturasVencidas,
        porcentajeCobrado,
        porcentajePendiente: totalFacturas > 0 ? Math.round((facturasPendientes / totalFacturas) * 100) : 0,
        porcentajeVencido: totalFacturas > 0 ? Math.round((facturasVencidas / totalFacturas) * 100) : 0,
        clientesActivos,
        clientesNuevos: 0,
        cobrosPorCobrador: []
      };
    },
    alerts: async () => {
      const facturas = await firebaseService.facturas.getAll({ estado: 'pendiente' });
      const today = new Date();
      const fiveDays = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

      const todayStr = today.toISOString().split('T')[0];
      const fiveDaysStr = fiveDays.toISOString().split('T')[0];

      const vencidas = facturas.filter(f => f.fechaVencimiento && f.fechaVencimiento < todayStr);
      const proximas = facturas.filter(f => f.fechaVencimiento && f.fechaVencimiento >= todayStr && f.fechaVencimiento <= fiveDaysStr);

      return [
        ...vencidas.map(f => ({ tipo: 'vencida', factura: f })),
        ...proximas.map(f => ({ tipo: 'proximavencer', factura: f }))
      ].slice(0, 10);
    }
  }
};

export default firebaseService;