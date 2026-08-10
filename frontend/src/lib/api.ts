const API_URL = 'http://localhost:4000'


// Connect the login form to the backend.
export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al iniciar sesión');
  }

  return data as { token: string }
}


export interface Producto {
  id: number
  nombre: string
  categoria: string
  precioUnitario: number
  stock: number
  imagenUrl: string | null
}

export type ProductoInput = Omit<Producto, 'id' | 'imagenUrl'> & {
  imagenUrl?: string
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getProductos(token: string, params?: { categoria?: string; search?: string }) {
  const query = new URLSearchParams()
  if (params?.categoria) query.set('categoria', params.categoria)
  if (params?.search) query.set('search', params.search)

  const res = await fetch(`${API_URL}/productos?${query}`, {
    headers: authHeaders(token),
  })

  if (!res.ok) throw new Error('No se pudieron cargar los productos')
  return res.json() as Promise<Producto[]>
}

export async function createProducto(token: string, data: ProductoInput) {
  const res = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })

  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Error al crear producto')
  return result as Producto
}

export async function updateProducto(token: string, id: number, data: ProductoInput) {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })

  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Error al actualizar producto')
  return result as Producto
}

export async function deleteProducto(token: string, id: number) {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  if (!res.ok) throw new Error('Error al eliminar producto')
}











export type MetodoPago = 'COD' | 'CARD' | 'WALLET'

export interface Venta {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: number
  descuento: number
  montoTotal: number
  metodoPago: MetodoPago
  fecha: string
  region: string
  vendedor: { id: number; email: string }
  producto: { id: number; nombre: string; categoria: string }
  cliente: { id: number; nombre: string } | null
}

export interface VentaInput {
  productoId: number
  cantidad: number
  descuento: number
  metodoPago: MetodoPago
  region: string
}

export async function createVenta(token: string, data: VentaInput) {
  const res = await fetch(`${API_URL}/ventas`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })

  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Error al registrar la venta')
  return result as Venta
}

export interface VentaFilters {
  fecha_desde?: string
  fecha_hasta?: string
  vendedorId?: number
  region?: string
}

export async function getVentas(token: string, filters?: VentaFilters) {
  const query = new URLSearchParams()
  if (filters?.fecha_desde) query.set('fecha_desde', filters.fecha_desde)
  if (filters?.fecha_hasta) query.set('fecha_hasta', filters.fecha_hasta)
  if (filters?.vendedorId) query.set('vendedorId', String(filters.vendedorId))
  if (filters?.region) query.set('region', filters.region)

  const res = await fetch(`${API_URL}/ventas?${query}`, {
    headers: authHeaders(token),
  })

  if (!res.ok) throw new Error('No se pudo cargar el historial de ventas')
  return res.json() as Promise<Venta[]>
}

export interface Usuario {
  id: number
  email: string
  role: 'ADMIN' | 'VENDEDOR'
}

export async function getUsuarios(token: string) {
  const res = await fetch(`${API_URL}/usuarios`, {
    headers: authHeaders(token),
  })

  if (!res.ok) throw new Error('No se pudo cargar la lista de usuarios')
  return res.json() as Promise<Usuario[]>
}