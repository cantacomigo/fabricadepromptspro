import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
    const navigate = useNavigate()
    const { login, register } = useAuth()
    const [tab, setTab] = useState<'login' | 'register'>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPass, setShowPass] = useState(false)

    const [form, setForm] = useState({ name: '', email: '', password: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (tab === 'login') {
                await login(form.email, form.password)
            } else {
                if (!form.name) { setError('Nome é obrigatório'); setLoading(false); return }
                await register(form.email, form.password, form.name)
            }
            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao autenticar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            background: 'radial-gradient(ellipse at center top, rgba(147,51,234,0.12) 0%, transparent 70%)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 420 }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img
                        src="/logo.png"
                        alt="Fábrica de Prompts"
                        style={{
                            height: 80,
                            width: 'auto',
                            marginBottom: 16,
                            filter: 'drop-shadow(0 0 20px rgba(147,51,234,0.4))'
                        }}
                    />
                    <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'white' }}>Fábrica de Prompts</h1>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                        {tab === 'login' ? 'Entre para acessar seus prompts' : 'Crie sua conta gratuita'}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: '#0f0f1a', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: 32,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
                        {(['login', 'register'] as const).map(t => (
                            <motion.button
                                key={t}
                                onClick={() => { setTab(t); setError('') }}
                                style={{
                                    flex: 1, padding: '9px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                                    background: tab === t ? 'rgba(147,51,234,0.3)' : 'transparent',
                                    border: tab === t ? '1px solid rgba(147,51,234,0.4)' : '1px solid transparent',
                                    color: tab === t ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {t === 'login' ? 'Entrar' : 'Criar Conta'}
                            </motion.button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {tab === 'register' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Nome</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="Seu nome"
                                                style={{ ...inputStyle, paddingLeft: 42 }} />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: 16 }}>
                                    <label style={labelStyle}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="seu@email.com" required
                                            style={{ ...inputStyle, paddingLeft: 42 }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={labelStyle}>Senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                            placeholder="••••••••" required minLength={6}
                                            style={{ ...inputStyle, paddingLeft: 42, paddingRight: 42 }} />
                                        <button type="button" onClick={() => setShowPass(!showPass)}
                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}>
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                                        <AlertCircle size={15} /> {error}
                                    </motion.div>
                                )}

                                <motion.button type="submit" disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                                        background: loading ? 'rgba(147,51,234,0.5)' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 30px rgba(147,51,234,0.5)' } : {}}
                                    whileTap={!loading ? { scale: 0.98 } : {}}
                                >
                                    {loading ? 'Carregando...' : tab === 'login' ? 'Entrar na plataforma' : 'Criar conta grátis'}
                                </motion.button>
                            </motion.div>
                        </AnimatePresence>
                    </form>


                </div>
            </motion.div>
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
}

const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8
}
