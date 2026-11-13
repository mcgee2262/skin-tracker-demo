import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { CalendarCheck, Camera, ChartLine, House, ShoppingBag } from 'lucide-react'
import Home from './features/health/Home'
import Today from './features/skin/screens/Today'
import CheckIn from './features/skin/screens/CheckIn'
import Progress from './features/skin/screens/Progress'
import Photos from './features/skin/screens/Photos'
import Products from './features/skin/screens/Products'
import { useSkin } from './features/skin/SkinContext'

const tabs = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/skin', label: 'Skin', Icon: CalendarCheck },
  { to: '/progress', label: 'Progress', Icon: ChartLine },
  { to: '/photos', label: 'Photos', Icon: Camera },
  { to: '/products', label: 'Products', Icon: ShoppingBag },
]

export default function AppRoutes() {
  const { pathname } = useLocation()
  const { loading, error } = useSkin()
  const full = pathname === '/checkin'

  if (loading) return <div className="center-screen muted">Loading…</div>

  return (
    <>
      {error && <div className="banner">{error}</div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skin" element={<Today />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/products" element={<Products />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!full && (
        <nav className="tabbar">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
              {({ isActive }) => (
                <>
                  <Icon size={25} strokeWidth={2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={0.18} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}
