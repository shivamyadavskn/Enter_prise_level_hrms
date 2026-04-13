import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/index.js'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authApi.me()
      setUser(data.data)
    } catch {
      localStorage.clear()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    const { accessToken, refreshToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(u)
    toast.success(`Welcome back, ${u.employee?.firstName || u.email}!`)
    return u
  }

  const logout = async () => {
    try {
      await authApi.logout(localStorage.getItem('refreshToken'))
    } catch {}
    localStorage.clear()
    setUser(null)
    toast.success('Logged out successfully')
  }

  const hasRole = (...roles) => roles.includes(user?.role)

  const isAdmin = () => hasRole('SUPER_ADMIN', 'ADMIN')
  const isManager = () => hasRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  const isFinance = () => hasRole('SUPER_ADMIN', 'ADMIN', 'FINANCE')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isManager, isFinance }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
