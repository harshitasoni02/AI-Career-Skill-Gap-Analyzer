// UserContext.jsx — ONE shared place that knows who is logged in.
// Every component (Header, pages, guards) can call useUser() instead of
// fetching /api/me by itself. The user is re-checked when pages change.
import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { apiGet } from '../api.js'
import { DEMO_MODE } from '../config.js'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // The public demo has no account system; skip the session probe entirely.
    if (DEMO_MODE) {
      setUser(null)
      setLoading(false)
      return undefined
    }

    let alive = true
    apiGet('/api/me')
      .then((d) => { if (alive) setUser(d.user) })
      .catch(() => { if (alive) setUser(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [location.pathname])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
