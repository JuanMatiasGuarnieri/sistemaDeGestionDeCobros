# Sistema de Gestión Administrativa de Facturas

Sistema de gestión administrativa desarrollado como Progressive Web App (PWA) para el control de facturas, clientes y cobranzas de una empresa de servicios de emergencias médicas.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Características](#características)
3. [Tecnologías](#tecnologías)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Instalación](#instalación)
6. [Configuración](#configuración)
7. [Uso](#uso)
8. [Credenciales de Prueba](#credenciales-de-prueba)
9. [API OCR](#api-ocr)
10. [Despliegue](#despliegue)
11. [Funcionalidades Futuras](#funcionalidades-futuras)

---

## 📝 Descripción General

Esta aplicación permite gestionar el cobro de facturas de una empresa que ofrece servicios de pago mensual para cobertura de emergencias médicas. El sistema cuenta con:

- Gestión de clientes y contratos
- Registro y seguimiento de facturas
- Control de cobranzas
- Dashboard con estadísticas
- Reportes exportables
- Tema claro/oscuro
- Instalable como app nativa (PWA)

---

## ✨ Características

### Módulos Principales

| Módulo | Funcionalidades |
|--------|-----------------|
| **Dashboard** | Resumen mensual, estadísticas, alertas de facturas vencidas/próximas a vencer |
| **Clientes** | CRUD completo, búsqueda, gestión de contratos y planes |
| **Facturas** | Alta manual, importación desde Excel, escaneo OCR, estados (pendiente/cobrada/vencida) |
| **Cobros** | Registro de pagos con búsqueda de facturas, métodos de cobro (efectivo/transferencia) |
| **Reportes** | Exportación a Excel, resumen por cliente, detalle de facturación |

### Funcionalidades Adicionales

- ✅ Tema claro/oscuro (toggle en header)
- ✅ Registro automático de clientes al crear facturas
- ✅ Importación masiva de facturas desde Excel
- ✅ Escaneo de tablas impresas via OCR (20 hojas/mes)
- ✅ PWA instalable en móvil y escritorio
- ✅ Autenticación con roles (admin/cobrador)
- ✅ Persistencia de sesión

---

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework de interfaz de usuario
- **Vite** - Build tool y servidor de desarrollo
- **Tailwind CSS** - Framework de estilos
- **React Router** - Navegación
- **SheetJS (xlsx)** - Lectura/escritura de archivos Excel
- **Vite PWA** - Progressive Web App

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework de API REST
- **JSON Web Token (JWT)** - Autenticación
- **bcryptjs** - Hash de contraseñas

---

## 📁 Estructura del Proyecto

```
SISTEMA DE GESTION ADMINISTRATIVO/
├── backend/                    # Servidor API REST
│   ├── src/
│   │   ├── index.js           # Punto de entrada
│   │   ├── middleware/        # Middleware JWT
│   │   ├── models/            # Datos en memoria
│   │   └── routes/            # Endpoints API
│   ├── package.json
│   └── .env
│
├── src/                        # Frontend React
│   ├── assets/                # Logo e iconos
│   ├── components/            # Componentes reutilizables
│   │   ├── layout/            # Layout principal
│   │   └── common/            # Componentes comunes
│   ├── context/              # Contextos (Auth, Theme)
│   ├── pages/                # Páginas principales
│   ├── services/             # Servicios API, Excel, OCR
│   ├── App.jsx               # Componente raíz
│   └── main.jsx             # Punto de entrada
│
├── public/                    # Archivos estáticos
├── index.html                # HTML principal
├── vite.config.js           # Configuración Vite
├── tailwind.config.js       # Configuración Tailwind
└── package.json             # Dependencias frontend
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- npm o yarn

### Pasos

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias del frontend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

---

## ⚙️ Configuración

### Variables de Entorno (Backend)

Crear archivo `backend/.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_secret_key_aqui
```

### Ejecutar el Proyecto

**Terminal 1 - Backend (puerto 3000):**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend (puerto 5173):**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

---

## 📖 Uso

### Inicio de Sesión

Usar credenciales de prueba para acceder al sistema.

### Navegación

- **Dashboard**: Ver resumen y estadísticas del mes
- **Clientes**: Gestionar clientes y sus contratos
- **Facturas**: Crear, importar o escanear facturas
- **Cobros**: Registrar pagos de facturas
- **Reportes**: Exportar datos a Excel

### Registro de Facturas

1. Ir a **Facturas** → **Nueva Factura**
2. Completar número, cliente, dirección, monto
3. Si el cliente no existe, se registra automáticamente

### Importación desde Excel

1. Ir a **Facturas** → **Importar Excel**
2. Seleccionar archivo con columnas: número, cliente, dirección, monto, fecha

### Escaneo OCR

1. Ir a **Facturas** → **Escanear**
2. Subir foto de tabla impressa
3. El sistema procesa y extrae los datos

### Registro de Cobros

1. Ir a **Cobros** → **Registrar Cobro**
2. Buscar factura por número o nombre de cliente
3. Completar monto, fecha y método de pago

---

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@demo.com | admin123 |
| Cobrador | cobrador@demo.com | cobrador123 |

---

## 🔍 API OCR

El sistema integra **OCR.space** para escanear tablas impressas:

- **Límite gratuito**: 500 solicitudes/día
- **Para este proyecto**: ~20 hojas/mes
- **API Key**: `helloworld` (para desarrollo)

### Configuración de producción

Para mayor volumen, obtener una API key en: https://ocr.space/ocr-api

---

## 📦 Despliegue

### Opciones de Hosting

1. **Vercel** (recomendado para frontend)
2. **Netlify** (alternativa)
3. **Firebase Hosting**
4. **VPS propio** (nginx + PM2)

### Despliegue en Vercel

1. Subir proyecto a GitHub
2. Importar en Vercel
3. Configurar build:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Desplegar

**Nota**: El backend requiere hosting separado (Render, Railway, Fly.io) o usar Firebase Functions.

---

## 🔮 Funcionalidades Futuras

- [ ] Integración con base de datos real (PostgreSQL/MongoDB)
- [ ] Notificaciones push
- [ ] Modo offline completo
- [ ] Sincronización de datos
- [ ] Roles más granulares (supervisor, cajero)
- [ ] Generación de PDFs
- [ ] Integración con métodos de pago
- [ ] Backup automático

---

## 📄 Licencia

Este proyecto es para uso interno.

---

## 👤 Autor
Desarrollado con ❤️ por **GUARNIERI NETWORK**.
Sistema de Gestión Administrativa de Facturas

Versión: 1.0.0
Fecha: Mayo 2026
