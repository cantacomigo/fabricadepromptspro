import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PromptsProvider } from './contexts/PromptsContext'
import Header from './components/layout/Header.tsx'
import Footer from './components/layout/Footer.tsx'
import Home from './pages/Home.tsx'
import AuthPage from './pages/AuthPage.tsx'
import UserDashboard from './pages/UserDashboard.tsx'
import Admin from './pages/Admin.tsx'
import { useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { initMercadoPago } from '@mercadopago/sdk-react'

// Initialize Mercado Pago with public key from env
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || '')

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
    const { user, isAdmin } = useAuth()
    if (!user) return <Navigate to="/auth" replace />
    if (adminOnly && !isAdmin) return <Navigate to="/" replace />
    return <>{children}</>
}

function AppRoutes() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1 }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly>
                            <Admin />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <PromptsProvider>
                    <CartProvider>
                        <AppRoutes />
                    </CartProvider>
                </PromptsProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
