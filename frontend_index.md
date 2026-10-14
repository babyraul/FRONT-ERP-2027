# 🌐 Mapa de Arquitectura Frontend - Sistema Market Admin (pERP-2027)

> **Documento de Arquitectura y Referencia Técnica**  
> **Proyecto:** Sistema Market Admin / pERP Frontend  
> **Stack Principal:** React 18, Vite 5, Tailwind CSS 3, React Router v6, Zustand 4, Axios, TanStack React Table v8, Lucide React / Heroicons.

---

## 1. 📁 Estructura del Árbol de Directorios y Propósito

```
FRONT/
├── public/                       # Activos estáticos públicos (logos, favicons e íconos)
│   ├── images/                   # Logotipos de la aplicación y marcas
│   └── icon.ico                  # Favicon del sistema
├── server/                       # Microservicio Node.js auxiliar para envíos de correo
│   └── emailServer.js            # Servidor Express + Nodemailer (puerto 3001)
├── src/                          # Código fuente principal de la aplicación React
│   ├── components/               # Componentes reutilizables de UI y layout general
│   │   ├── layout/               # Componentes estructurales de la aplicación
│   │   └── ui/                   # Componentes de interfaz atómicos y modulares
│   ├── hooks/                    # Hooks personalizados de React
│   ├── modules/                  # Arquitectura modular por dominios de negocio
│   │   ├── auth/                 # Módulo de Autenticación y Login
│   │   ├── clientes/             # Gestión de Clientes / Directorio comercial
│   │   ├── compras/             # Módulo de Compras y Abastecimiento (en desarrollo)
│   │   ├── dashboard/            # Panel de métricas, KPIs y estadísticas
│   │   ├── manager/              # Módulo de Administración del Sistema (Multi-tenant)
│   │   ├── productos/            # Gestión de Catálogo e Inventario básico
│   │   ├── reportes/             # Reportes analíticos y gráficos
│   │   ├── stock/                # Módulo de Stock y Kárdex (en desarrollo)
│   │   └── ventas/               # Registro de transacciones y comprobantes
│   ├── router/                   # Configuración del enrutador central (React Router DOM)
│   ├── store/                    # Manejo de estado global con Zustand
│   ├── utils/                    # Clientes HTTP, helpers y utilitarios
│   ├── App.jsx                   # Componente raíz con proveedores de contexto/tema
│   ├── index.css                 # Estilos globales y directivas Tailwind CSS
│   └── main.jsx                  # Punto de entrada de Vite (ReactDOM.createRoot)
├── tests/                        # Suite de pruebas automatizadas
│   ├── setup.js                  # Configuración de Vitest y Testing Library
│   └── unit/                     # Pruebas unitarias de componentes
├── index.html                    # Plantilla HTML principal
├── package.json                  # Dependencias y scripts del proyecto
├── postcss.config.js             # Configuración de PostCSS para Tailwind
├── tailwind.config.js            # Tema, paleta y extensiones de diseño Tailwind
└── vite.config.js                # Configuración del bundler Vite
```

### Propósito Detallado de Cada Carpeta Clave

| Carpeta | Propósito / Responsabilidad |
| :--- | :--- |
| `FRONT/public/` | Archivos estáticos accesibles directamente por el navegador (logos de MiFacturaPerú, íconos de la pestaña). |
| `FRONT/server/` | Servidor independiente en Express para envío de correos transaccionales con Nodemailer (`/api/email/send`). |
| `FRONT/src/components/layout/` | Estructura general de navegación: contenedor base (`Layout`), barra superior (`Navbar`), barra lateral (`Sidebar`) y guardián de rutas (`ProtectedRoute`). |
| `FRONT/src/components/ui/` | Componentes de UI transversales reutilizables: tablas con paginación (`DataTable`), modales (`Modal`), límites de error (`ErrorBoundary`), control de permisos en interfaz (`Can`), y notificaciones toast (`ToastContainer`). |
| `FRONT/src/hooks/` | Hooks de lógica de negocio y UI: `usePermission.js` (validación de permisos RBAC) y `useTheme.js` (modo claro/oscuro). |
| `FRONT/src/modules/` | Organización modular del ERP. Cada módulo contiene sus páginas (`pages/`), controladores (`controllers/`) y componentes locales (`components/`). |
| `FRONT/src/router/` | Definición de rutas declarativas con `createBrowserRouter`, jerarquía de layouts y rutas protegidas. |
| `FRONT/src/store/` | Stores globales con Zustand para autenticación, notificaciones y entidades de negocio. |
| `FRONT/src/utils/` | Cliente Axios configurado (`api.js`), exportación a hojas de cálculo (`exportExcel.js`) y utilidades de alertas (`toast.js`). |
| `FRONT/tests/` | Pruebas unitarias y de integración ejecutadas con Vitest y `@testing-library/react`. |

---

## 2. 🗺️ Mapa de Rutas de las Pantallas (Routing)

La navegación del sistema está centralizada en [`FRONT/src/router/index.jsx`](FRONT/src/router/index.jsx) usando `createBrowserRouter` de `react-router-dom`:

| Ruta (Path) | Componente / Página | Nivel de Acceso / Protección | Descripción Funcional |
| :--- | :--- | :--- | :--- |
| `/login` | `<Login />` (`modules/auth`) | Público | Formulario de autenticación de usuario y selección de credenciales. |
| `/` | `Navigate -> /dashboard` | Sesión activa | Redirección por defecto a la vista principal del dashboard. |
| `/dashboard` | `<Dashboard />` (`modules/dashboard`) | Dentro de `<Layout />` | Métricas de ventas, accesos directos y gráficos estadísticos. |
| `/productos` | `<Productos />` (`modules/productos`) | Dentro de `<Layout />` | Catálogo de productos, filtros por categoría, búsqueda y CRUD básico. |
| `/clientes` | `<Clientes />` (`modules/clientes`) | Dentro de `<Layout />` | Directorio de clientes con filtros por RUC/Nombre y exportación. |
| `/ventas` | `<Ventas />` (`modules/ventas`) | Dentro de `<Layout />` | Histórico y registro de comprobantes (Facturas / Boletas). |
| `/caja` | `<Caja />` (`modules/caja`) | `<ProtectedRoute>` | Gestión operativa de turnos de caja, fondo de apertura, ventas y arqueo/cierre de turnos. |
| `/reportes` | `<Reportes />` (`modules/reportes`) | Dentro de `<Layout />` | Reportes detallados y gráficos analíticos con Recharts. |
| `/proveedores` | `<Proveedores />` (`modules/proveedores`) | `<ProtectedRoute>` | Directorio de proveedores, clasificación, búsqueda y CRUD con integración a SUNAT. |
| `/usuarios` | `<Usuarios />` (`modules/manager`) | `<ProtectedRoute>` | Gestión de usuarios del sistema y asignación de accesos por sucursal. |
| `/configuracion` | `<Configuracion />` (`modules/manager`) | `<ProtectedRoute>` | Preferencias y configuraciones generales del sistema. |
| `/empresas` | `<Empresas />` (`modules/manager`) | `<ProtectedRoute>` | Administración de empresas multi-tenant y asignación de módulos contratados. |
| `/sucursales` | `<Sucursales />` (`modules/manager`) | `<ProtectedRoute>` | Registro y configuración de sedes / sucursales asociadas a empresas. |
| `/almacenes` | `<Almacenes />` (`modules/manager`) | `<ProtectedRoute>` | Configuración de almacenes físicos asignados a sucursales. |
| `/cajas` | `<Cajas />` (`modules/manager`) | `<ProtectedRoute>` | Configuración administrativa de series y correlativos de facturación. |
| `/modulos` | `<Modulos />` (`modules/manager`) | `<ProtectedRoute>` | Catálogo de módulos y submódulos disponibles en el ERP. |
| `/roles` | `<Roles />` (`modules/manager`) | `<ProtectedRoute>` | Definición de roles y matriz granular de permisos (RBAC). |

> **Mecanismo de Protección:**  
> Las rutas del módulo administrativo `manager` están envueltas en `<ProtectedRoute>`. Este componente verifica que exista sesión activa (`token` y `isAuthenticated`) y valida que la ruta requerida coincida con los permisos y módulos autorizados dinámicamente en el menú del usuario.

---

## 3. 🧩 Índice de Componentes Principales y su Ubicación

### A. Layout y Estructura Global
* **`<Layout />`** ([`FRONT/src/components/layout/Layout.jsx`](FRONT/src/components/layout/Layout.jsx)): Envoltorio principal que estructura el `Sidebar` lateral colapsable, el `Navbar` superior y el área de contenido (`<Outlet />`).
* **`<Navbar />`** ([`FRONT/src/components/layout/Navbar.jsx`](FRONT/src/components/layout/Navbar.jsx)): Barra de navegación superior con selector dinámico de sucursales activas, switch de tema claro/oscuro y menú de perfil de usuario.
* **`<Sidebar />`** ([`FRONT/src/components/layout/Sidebar.jsx`](FRONT/src/components/layout/Sidebar.jsx)): Menú lateral dinámico que renderiza las opciones según los permisos devueltos por el backend (`/auth/menu`).
* **`<ProtectedRoute />`** ([`FRONT/src/components/layout/ProtectedRoute.jsx`](FRONT/src/components/layout/ProtectedRoute.jsx)): Componente guardián que bloquea el acceso si no hay token o si el usuario no tiene permisos suficientes.
* **`<ThemeToggle />`** ([`FRONT/src/components/ThemeToggle.jsx`](FRONT/src/components/ThemeToggle.jsx)): Botón de alternancia entre tema visual claro y oscuro con persistencia en `localStorage`.

### B. Componentes Reutilizables de UI (`components/ui`)
* **`<DataTable />`** ([`FRONT/src/components/ui/DataTable.jsx`](FRONT/src/components/ui/DataTable.jsx)): Tabla de datos modular potenciada por `@tanstack/react-table` con ordenamiento por columnas, paginación y búsqueda global.
* **`<Modal />`** ([`FRONT/src/components/ui/Modal.jsx`](FRONT/src/components/ui/Modal.jsx)): Ventana modal estándar con animaciones, backdrop, tecla escape y bloqueo de scroll.
* **`<Can />`** ([`FRONT/src/components/ui/Can.jsx`](FRONT/src/components/ui/Can.jsx)): Renderizador condicional según permisos de usuario (`hasPermission(permission)`).
* **`<ErrorBoundary />` / `<RouteErrorBoundary />`** ([`FRONT/src/components/ui/ErrorBoundary.jsx`](FRONT/src/components/ui/ErrorBoundary.jsx)): Captura y recuperación ante excepciones imprevistas en el ciclo de vida de React o en las rutas.
* **`<ToastContainer />`** ([`FRONT/src/components/ui/ToastContainer.jsx`](FRONT/src/components/ui/ToastContainer.jsx)): Contenedor flotante de notificaciones informativas, de éxito o error.

### C. Modales de Gestión Administrativa (`modules/manager/components`)
* **`<EmpresaModal />`**: Alta y edición de empresas con consulta automática de RUC en SUNAT vía API.
* **`<EmpresaModulosModal />`**: Modal interactivo de asignación de módulos contratados por empresa.
* **`<SucursalModal />`**: Formulario de creación y modificación de sucursales/sedes.
* **`<AlmacenModal />`**: Creación y edición de almacenes físicos.
* **`<CajaModal />`**: Mantenimiento de cajas registradoras y vinculación con tipos de comprobantes.
* **`<UsuarioModal />`**: Formulario de usuarios (credenciales, email y estado).
* **`<UsuarioAccesosModal />`**: Asignación granular de permisos, empresa, sucursal y rol por usuario.
* **`<RolModal />`**: Gestión del catálogo de roles del sistema.
* **`<RolPermisosModal />`**: Matriz de permisos por módulo asignables a roles.
* **`<ModuloModal />`**: Catálogo de módulos y rutas del sistema.

---

## 4. ⚡ Gestión del Estado Global (Zustand)

El proyecto utiliza **Zustand** como solución ligera, rápida y reactiva para el estado global sin necesidad de un `Provider` pesado.

| Store | Ubicación | Persistencia | Propósito y Contenido del Estado |
| :--- | :--- | :--- | :--- |
| **`useAuthStore`** | [`FRONT/src/store/useAuthStore.js`](FRONT/src/store/useAuthStore.js) | `localStorage` (`auth-storage`) | Gestiona la sesión de usuario (`user`, `token`, `isAuthenticated`, `menu`). Provee acciones asíncronas para `login`, cambio de sucursal en caliente (`switchBranch`), obtención del menú dinámico (`fetchMenu`) y `logout`. |
| **`useFactoresStore`** | [`FRONT/src/store/useFactoresStore.js`](FRONT/src/store/useFactoresStore.js) | `localStorage` (`erp-factores-storage`) | Gestiona los factores de conversión de la tabla `tipo_factores` (`PRECIO`: 100, `VOLUMEN`: 1000000). Provee helpers de conversión (`toPrecioInt`, `toPrecioVisual`, `toVolumenInt`, `toVolumenVisual`) para trabajar en céntimos/submúltiplos en todo el sistema. |
| **`useNotificationStore`** | [`FRONT/src/store/useNotificationStore.js`](FRONT/src/store/useNotificationStore.js) | En memoria | Cola de notificaciones emergentes (`notifications`). Gestiona timeouts automáticos para auto-cierre y eliminación manual. |
| **`useProductosStore`** | [`FRONT/src/store/useProductosStore.js`](FRONT/src/store/useProductosStore.js) | En memoria | Almacena y filtra catálogo de productos (`productos`, `busqueda`, `categoriaFiltro`). CRUD local y cálculos derivados. |
| **`useClientesStore`** | [`FRONT/src/store/useClientesStore.js`](FRONT/src/store/useClientesStore.js) | En memoria | Gestión de clientes comerciales (`clientes`, `busqueda`), filtros por documento/razón social y acciones de actualización. |
| **`useVentasStore`** | [`FRONT/src/store/useVentasStore.js`](FRONT/src/store/useVentasStore.js) | En memoria | Histórico de ventas (`ventas`, `estadoFiltro`), sumatorias por fechas (`getTotalesPorDia`) y estados de comprobantes. |
| **`useUsuariosStore`** | [`FRONT/src/store/useUsuariosStore.js`](FRONT/src/store/useUsuariosStore.js) | En memoria | Directorio de usuarios y estados de acceso para vistas rápidas de configuración. |

---

## 5. 🔌 Servicios y Clientes API (Comunicación con Backend)

### Cliente Base de Axios (`src/utils/api.js`)
La aplicación cuenta con una instancia centralizada de Axios en [`FRONT/src/utils/api.js`](FRONT/src/utils/api.js):
- **Base URL:** `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`
- **Interceptor de Solicitud (Request):** Inyecta automáticamente el token JWT obtenido del estado reactivo de Zustand:
  ```javascript
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  ```
- **Interceptor de Respuesta (Response):** Monitorea respuestas con código `401 Unauthorized`. Si el token expira o es revocado, ejecuta automáticamente `useAuthStore.getState().logout()`, redirigiendo al login.

### Controladores y Endpoints de API Conectados

Los módulos de gestión (`modules/manager/controllers/`) implementan la arquitectura de controladores para interactuar con la API REST del backend:

| Controlador | Archivo | Endpoints que Consume en el Backend |
| :--- | :--- | :--- |
| **`auth`** (Store) | [`FRONT/src/store/useAuthStore.js`](FRONT/src/store/useAuthStore.js) | `POST /auth/login`<br>`POST /auth/switch-branch`<br>`GET /auth/menu` |
| **`empresaController`** | [`FRONT/src/modules/manager/controllers/empresa.js`](FRONT/src/modules/manager/controllers/empresa.js) | `GET /empresas`<br>`GET /empresas/:id`<br>`POST /empresas`<br>`PUT /empresas/:id`<br>`DELETE /empresas/:id`<br>`GET /empresas/:id/modulos`<br>`POST /empresas/:id/modulos` |
| **`sucursalController`** | [`FRONT/src/modules/manager/controllers/sucursal.js`](FRONT/src/modules/manager/controllers/sucursal.js) | `GET /sucursales`<br>`GET /sucursales/:id`<br>`POST /sucursales`<br>`PUT /sucursales/:id`<br>`DELETE /sucursales/:id` |
| **`almacenController`** | [`FRONT/src/modules/manager/controllers/almacen.js`](FRONT/src/modules/manager/controllers/almacen.js) | `GET /almacenes`<br>`GET /almacenes/:id`<br>`POST /almacenes`<br>`PUT /almacenes/:id`<br>`DELETE /almacenes/:id` |
| **`cajaController`** | [`FRONT/src/modules/manager/controllers/caja.js`](FRONT/src/modules/manager/controllers/caja.js) | `GET /cajas`<br>`GET /cajas/:id`<br>`POST /cajas`<br>`PUT /cajas/:id`<br>`DELETE /cajas/:id`<br>`GET /tipos-comprobante`<br>`GET /usuarios` |
| **`usuarioController`** | [`FRONT/src/modules/manager/controllers/usuario.js`](FRONT/src/modules/manager/controllers/usuario.js) | `GET /usuarios`<br>`GET /usuarios/:id`<br>`POST /usuarios`<br>`PUT /usuarios/:id`<br>`DELETE /usuarios/:id`<br>`GET /usuarios/:id/accesos`<br>`POST /usuarios/:id/accesos`<br>`PUT /usuarios/:id/accesos/:accesoId`<br>`DELETE /usuarios/:id/accesos/:accesoId` |
| **`rolController`** | [`FRONT/src/modules/manager/controllers/rol.js`](FRONT/src/modules/manager/controllers/rol.js) | `GET /roles`<br>`GET /roles/:id`<br>`POST /roles`<br>`PUT /roles/:id`<br>`DELETE /roles/:id`<br>`GET /roles/:id/permisos`<br>`POST /roles/:id/permisos` |
| **`moduloController`** | [`FRONT/src/modules/manager/controllers/modulo.js`](FRONT/src/modules/manager/controllers/modulo.js) | `GET /modulos`<br>`GET /modulos/:id`<br>`POST /modulos`<br>`PUT /modulos/:id`<br>`DELETE /modulos/:id` |
| **`permisoController`** | [`FRONT/src/modules/manager/controllers/permiso.js`](FRONT/src/modules/manager/controllers/permiso.js) | `GET /permisos` |
| **`productoController`** | [`FRONT/src/modules/productos/controllers/producto.js`](FRONT/src/modules/productos/controllers/producto.js) | `GET /productos`<br>`GET /productos/:id`<br>`POST /productos`<br>`PUT /productos/:id`<br>`DELETE /productos/:id` |
| **`clienteController`** | [`FRONT/src/modules/clientes/controllers/cliente.js`](FRONT/src/modules/clientes/controllers/cliente.js) | `GET /clientes`<br>`GET /clientes/:id`<br>`POST /clientes`<br>`PUT /clientes/:id`<br>`DELETE /clientes/:id` |
| **`proveedorController`** | [`FRONT/src/modules/proveedores/controllers/proveedor.js`](FRONT/src/modules/proveedores/controllers/proveedor.js) | `GET /proveedores`<br>`GET /proveedores/:id`<br>`POST /proveedores`<br>`PUT /proveedores/:id`<br>`DELETE /proveedores/:id` |
| **Consultas Sunat / RUC** | [`FRONT/src/modules/manager/components/EmpresaModal.jsx`](FRONT/src/modules/manager/components/EmpresaModal.jsx) | `GET /utils/consulta-documento/RUC/:ruc` |
| **`tablasFijasService`** | [`FRONT/src/utils/tablasFijas.js`](FRONT/src/utils/tablasFijas.js) | Catálogos públicos y fijos (`/api/tipos-comprobante`, `/api/tipos-documento`, `/api/tipos-afectacion-igv`, `/api/tipos-unidades-medida`, `/api/tipos-moneda`, `/api/tipos-metodo-pago`, `/api/tipos-pago`, `/api/tipos-operacion`, `/api/tipos-tributos`, `/api/tipos-existencia`, `/api/tipos-impuesto`, `/api/tipos-factores`, `/api/tipos-stock`, `/api/tipos-motivo-traslado`, `/api/tipos-detraccion`, `/api/tipos-cambio`). |
| **Servidor de Correos** | [`FRONT/server/emailServer.js`](FRONT/server/emailServer.js) | `POST /api/email/send`<br>`GET /api/health` |

---
