import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, User, LogOut, LayoutDashboard, ShieldCheck, Menu, X, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export default function Header() {
    const { user, isAdmin, logout } = useAuth()
    const { itemCount, setCartOpen } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [dropOpen, setDropOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    // Check for missing Supabase config
    const isConfigMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('seu_projeto')

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
        setDropOpen(false)
    }

    const navLinks = [
        { label: 'Galeria', to: '/' },
        { label: 'Como funciona', to: '/#como-funciona' },
        ...(user ? [{ label: 'Meus Prompts', to: '/dashboard' }] : []),
        ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
    ]

    return (
        <>
            {isConfigMissing && (
                <div style={{
                    background: 'linear-gradient(90deg, #9333ea, #ef4444)',
                    color: 'white', padding: '8px 24px', textAlign: 'center',
                    fontSize: 13, fontWeight: 600, position: 'relative', zIndex: 1100
                }}>
                    ⚠️ Supabase não configurado! Renomeie o arquivo .env.example para .env e coloque suas chaves.
                </div>
            )}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(5, 5, 8, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 100 }}>
                        {/* Logo */}
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <motion.div
                                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <img
                                    src="/logo.png"
                                    alt="Fábrica de Prompts Pro"
                                    style={{
                                        height: 80,
                                        width: 'auto',
                                        filter: 'drop-shadow(0 0 10px rgba(147,51,234,0.4))'
                                    }}
                                />
                            </motion.div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
                            {navLinks.map(link => (
                                <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                                    <motion.div
                                        style={{
                                            padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                                            color: location.pathname === link.to ? 'white' : 'rgba(255,255,255,0.6)',
                                            background: location.pathname === link.to ? 'rgba(147,51,234,0.2)' : 'transparent',
                                            border: location.pathname === link.to ? '1px solid rgba(147,51,234,0.4)' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        whileHover={{ color: 'white', background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        {link.label}
                                    </motion.div>
                                </Link>
                            ))}
                        </nav>

                        {/* Right actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Cart Button */}
                            <motion.button
                                onClick={() => setCartOpen(true)}
                                style={{
                                    position: 'relative', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                                    width: 40, height: 40, borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ShoppingCart size={20} />
                                {itemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{
                                            position: 'absolute', top: -5, right: -5,
                                            background: '#9333ea', color: 'white',
                                            fontSize: 10, fontWeight: 800,
                                            minWidth: 18, height: 18, borderRadius: 9,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0 4px', border: '2px solid #050508'
                                        }}
                                    >
                                        {itemCount}
                                    </motion.span>
                                )}
                            </motion.button>

                            {user ? (
                                <div style={{ position: 'relative' }}>
                                    <motion.button
                                        onClick={() => setDropOpen(!dropOpen)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '8px 14px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500
                                        }}
                                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <div style={{
                                            width: 26, height: 26, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
                                        }}>
                                            {(user.displayName || user.email)[0].toUpperCase()}
                                        </div>
                                        {user.displayName || user.email.split('@')[0]}
                                    </motion.button>

                                    <AnimatePresence>
                                        {dropOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                style={{
                                                    position: 'absolute', right: 0, top: '110%',
                                                    background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 12, padding: 8, minWidth: 200, zIndex: 200,
                                                    boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
                                                }}
                                            >
                                                <DropItem icon={<LayoutDashboard size={15} />} label="Meus Prompts" onClick={() => { navigate('/dashboard'); setDropOpen(false) }} />
                                                {isAdmin && (
                                                    <DropItem icon={<ShieldCheck size={15} />} label="Painel Admin" onClick={() => { navigate('/admin'); setDropOpen(false) }} />
                                                )}
                                                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                                                <DropItem icon={<LogOut size={15} />} label="Sair" onClick={handleLogout} danger />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <motion.button
                                    onClick={() => navigate('/auth')}
                                    style={{
                                        padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                                        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', cursor: 'pointer'
                                    }}
                                    whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(147,51,234,0.4)' }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Entrar
                                </motion.button>
                            )}

                            {/* Mobile menu btn */}
                            <motion.button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                style={{
                                    display: 'none', padding: 8, borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', cursor: 'pointer'
                                }}
                                className="mobile-menu-btn"
                                whileTap={{ scale: 0.95 }}
                            >
                                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </motion.button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}
                            >
                                {navLinks.map(link => (
                                    <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
                                        <div style={{ padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{link.label}</div>
                                    </Link>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <style>{`
                    @media (max-width: 768px) {
                        .desktop-nav { display: none !important; }
                        .mobile-menu-btn { display: flex !important; }
                    }
                `}</style>
            </header>
        </>
    )
}

function DropItem({ icon, label, onClick, danger = false }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
    return (
        <motion.button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: danger ? '#f87171' : 'rgba(255,255,255,0.8)',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
            }}
            whileHover={{ background: danger ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.05)', color: danger ? '#f87171' : 'white' }}
        >
            {icon} {label}
        </motion.button>
    )
}
