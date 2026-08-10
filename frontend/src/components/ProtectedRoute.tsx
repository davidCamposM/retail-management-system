import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, DEFAULT_ROUTE_BY_ROLE } from '../lib/permissions'
import Layout from './Layout'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!canAccess(role, location.pathname)) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[role!]} replace />
  }

  return <Layout>{children}</Layout>
}