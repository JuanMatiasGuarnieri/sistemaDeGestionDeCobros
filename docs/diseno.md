# Diseño del Sistema de Gestión

Este documento muestra las vistas principales de la aplicación.

## Pantallas Principales

### 1. Login
- Diseño split-screen (desktop)
- Panel izquierdo con gradiente azul y logo
- Formulario con iconos en campos
- Botón de tema claro/oscuro

### 2. Dashboard
- Selector de mes
- 4 tarjetas de estadísticas con iconos de colores
- Gráficos de progreso de facturas
- Lista de cobros por cobrador
- Alertas de facturas vencidas/próximas

### 3. Facturas
- Filtros: búsqueda, mes, estado
- Botones: Importar Excel, Escanear, Nueva Factura
- Tabla con estados con badges de colores
- Modal de creación con búsqueda de clientes

### 4. Cobros
- Resumen: total cobrado, cantidad, pendientes
- Tabla de cobros registrados
- Modal con búsqueda de facturas por número o cliente

### 5. Clientes
- Lista con búsqueda
- CRUD completo
- Estados activo/inactivo

### 6. Reportes
- Tarjetas de exportación (Excel)
- Resumen del mes
- Detalle por método de pago

## Componentes Visuales

### Colores
- **Primario**: #3b82f6 (azul)
- **Éxito**: #10b981 (verde)
- **Advertencia**: #f59e0b (amarillo)
- **Peligro**: #ef4444 (rojo)

### Elementos UI
- Cards con sombras suaves
- Badges redondeados
- Buttons con gradientes
- Inputs con focus states
- Toggle tema claro/oscuro

### Responsive
- Sidebar colapsable
- Grid adaptativo
- Modales scrollables