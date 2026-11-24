import {
  HomeIcon,
  CubeIcon,
  UsersIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  Square3Stack3DIcon,
  FolderIcon,
  TruckIcon,
  BanknotesIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  TagIcon
} from '@heroicons/react/24/outline'

/**
 * Mapa unificado de íconos Heroicons por código/nombre de módulo.
 */
export function getIconForModule(codigoOrName = '') {
  const code = String(codigoOrName).toUpperCase()
  if (code.includes('FACTURACION') || code.includes('SUNAT')) return DocumentTextIcon
  if (code.includes('PREVENTA')) return ClipboardDocumentListIcon
  if (code.includes('VALE')) return ReceiptPercentIcon
  if (code.includes('VENTAS') || code.includes('VENDER')) return ShoppingCartIcon
  if (code.includes('CAJA')) return BanknotesIcon
  if (code.includes('COMBO')) return SparklesIcon
  if (code.includes('PRECIO')) return TagIcon
  if (code.includes('STOCK') || code.includes('KARDEX')) return ArchiveBoxIcon
  if (code.includes('COMPRA')) return ShoppingBagIcon
  if (code.includes('PRODUCTOS') || code.includes('CATALOGOS')) return CubeIcon
  if (code.includes('CLIENTES')) return UsersIcon
  if (code.includes('PROVEEDOR')) return TruckIcon
  if (code.includes('REPORTES')) return DocumentChartBarIcon
  if (code.includes('USUARIOS')) return UserGroupIcon
  if (code.includes('ROLES') || code.includes('PERMISOS')) return ShieldCheckIcon
  if (code.includes('EMPRESAS')) return BuildingOfficeIcon
  if (code.includes('SUCURSALES') || code.includes('ALMACEN')) return MapPinIcon
  if (code.includes('MODULOS') || code.includes('ADMINISTRACION')) return Square3Stack3DIcon
  if (code.includes('CONFIGURACION')) return Cog6ToothIcon
  if (code.includes('DASHBOARD') || code.includes('PRINCIPAL')) return HomeIcon
  return FolderIcon
}

/**
 * Construye secciones normalizadas y una lista plana de ítems para Sidebar, Breadcrumb y Ctrl+K.
 */
export function buildNavData(menu = [], user = null, { includeConfig = false } = {}) {
  if (!Array.isArray(menu)) return { sections: [], flatItems: [] }

  const filtered = includeConfig ? menu : menu.filter((m) => m.codigo !== 'CONFIGURACION')

  const sections = filtered.map((root) => ({
    id: root.id,
    title: root.nombre,
    codigo: root.codigo,
    ruta: root.ruta,
    icon: getIconForModule(root.codigo || root.nombre),
    items: (root.items || []).map((child) => ({
      id: child.id,
      to: child.ruta || `/${String(child.codigo || '').toLowerCase()}`,
      icon: getIconForModule(child.codigo || child.nombre),
      label: child.nombre,
      codigo: child.codigo || '',
      sectionTitle: root.nombre
    }))
  }))

  const hasDashboard = sections.some((s) => s.items.some((i) => i.to === '/dashboard'))
  if (!hasDashboard && user) {
    sections.unshift({
      id: 'dashboard-root',
      title: 'Principal',
      codigo: 'PRINCIPAL',
      icon: HomeIcon,
      items: [
        {
          id: 'dashboard-item',
          to: '/dashboard',
          icon: HomeIcon,
          label: 'Dashboard',
          codigo: 'DASHBOARD',
          sectionTitle: 'Principal'
        }
      ]
    })
  }

  const flatItems = []
  sections.forEach((sec) => {
    if (sec.items.length === 0 && sec.ruta) {
      flatItems.push({
        id: sec.id,
        to: sec.ruta,
        icon: sec.icon,
        label: sec.title,
        codigo: sec.codigo || '',
        sectionTitle: sec.title
      })
    } else {
      sec.items.forEach((it) => flatItems.push(it))
    }
  })

  return { sections, flatItems }
}

const EXTRA_ROUTE_LABELS = {
  '/precios': { sectionTitle: 'Catálogos', label: 'Precios Masivos' },
  '/consulta-precios': { sectionTitle: 'Catálogos', label: 'Consultador de Precios' },
  '/vender/pagar': { sectionTitle: 'Ventas', label: 'Cobrar Pedido' },
  '/pagar': { sectionTitle: 'Ventas', label: 'Cobrar Pedido' },
  '/configuracion': { sectionTitle: 'Administración', label: 'Configuración' }
}

export function resolveBreadcrumb(pathname, flatItems = []) {
  if (EXTRA_ROUTE_LABELS[pathname]) return EXTRA_ROUTE_LABELS[pathname]
  const exact = flatItems.find((it) => it.to === pathname)
  if (exact) return { sectionTitle: exact.sectionTitle, label: exact.label }
  const prefix = flatItems.find((it) => it.to !== '/' && pathname.startsWith(`${it.to}/`))
  if (prefix) return { sectionTitle: prefix.sectionTitle, label: prefix.label }
  return null
}
