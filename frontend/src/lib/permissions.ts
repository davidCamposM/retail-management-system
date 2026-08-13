type Role = 'ADMIN' | 'VENDEDOR'

export const ROUTES_BY_ROLE: Record<Role, string[]> = {
  ADMIN: ['/dashboard', '/productos', '/ventas', '/historial'],
  VENDEDOR: ['/productos', '/ventas', '/historial'],
}

export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: '/dashboard',
  VENDEDOR: '/ventas',
}

export function canAccess(role: Role | null, path: string): boolean {
  if (!role) return false
  return ROUTES_BY_ROLE[role].includes(path)
}