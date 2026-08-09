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