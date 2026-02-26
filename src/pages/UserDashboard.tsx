import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ShoppingBag, Copy, Check, Calendar, DollarSign, Star, Zap, Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePrompts } from '../contexts/PromptsContext'
import PromptRevealModal from '../components/modals/PromptRevealModal'
import SubModal from '../components/modals/SubModal'
import type { Prompt } from '../lib/data'

export default function UserDashboard() {
    const { user, purchases } = useAuth()
    const { prompts } = usePrompts()
    const [tab, setTab] = useState<'prompts' | 'purchases' | 'subscription' | 'settings'>('prompts')
    const [copied, setCopied] = useState<string | null>(null)
    const [revealPrompt, setRevealPrompt] = useState<Prompt | null>(null)
    const [showSubModal, setShowSubModal] = useState(false)

    // Settings state
    const { updateProfile, updatePassword, subscription } = useAuth()
    const [newName, setNewName] = useState(user?.displayName || '')
    const [newPass, setNewPass] = useState('')
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const [loadingSettings, setLoadingSettings] = useState(false)

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingSettings(true)
        setSaveStatus(null)
        try {
            await updateProfile(newName)
            setSaveStatus({ type: 'success', msg: 'Perfil atualizado com sucesso!' })
        } catch (err: any) {
            setSaveStatus({ type: 'error', msg: err.message || 'Erro ao atualizar perfil' })
        } finally {
            setLoadingSettings(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPass.length < 6) return setSaveStatus({ type: 'error', msg: 'A senha deve ter pelo menos 6 caracteres' })
        setLoadingSettings(true)
        setSaveStatus(null)
        try {
            await updatePassword(newPass)
            setSaveStatus({ type: 'success', msg: 'Senha alterada com sucesso!' })
            setNewPass('')
        } catch (err: any) {
            setSaveStatus({ type: 'error', msg: err.message || 'Erro ao alterar senha' })
        } finally {
            setLoadingSettings(false)
        }
    }

    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed')
    const totalSpent = confirmedPurchases.reduce((a, p) => a + p.amount, 0)
    const purchasedPrompts = confirmedPurchases
        .map(p => prompts.find(pr => pr.id === p.promptId))
        .filter(Boolean) as Prompt[]

    const copyPrompt = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
            {/* Profile header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}
            >
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 800, color: 'white',
                    boxShadow: '0 0 30px rgba(147,51,234,0.5)'
                }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: 'white' }}>
                        Olá, {user?.displayName || user?.email?.split('@')[0]}! 👋
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 36 }}
            >
                {[
                    { icon: <BookOpen size={18} color="#9333ea" />, value: purchasedPrompts.length, label: 'Prompts', color: '#9333ea' },
                    { icon: <ShoppingBag size={18} color="#3b82f6" />, value: confirmedPurchases.length, label: 'Compras', color: '#3b82f6' },
                    { icon: <DollarSign size={18} color="#10b981" />, value: `R$ ${totalSpent.toFixed(2).replace('.', ',')}`, label: 'Total Gasto', color: '#10b981' },
                ].map(stat => (
                    <div key={stat.label} style={{ padding: '20px 24px', borderRadius: 14, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>{stat.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content' }}>
                {[
                    ['prompts', 'Meus Prompts', <BookOpen key="b" size={15} />],
                    ['purchases', 'Histórico', <ShoppingBag key="s" size={15} />],
                    ['subscription', 'Assinatura', <Zap key="z" size={15} />],
                    ['settings', 'Configurações', <Star key="st" size={15} />]
                ].map(([t, label, icon]) => (
                    <motion.button key={t as string} onClick={() => setTab(t as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                            background: tab === t ? 'rgba(147,51,234,0.25)' : 'transparent',
                            border: tab === t ? '1px solid rgba(147,51,234,0.4)' : '1px solid transparent',
                            color: tab === t ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer'
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {icon} {label}
                    </motion.button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {tab === 'prompts' && (
                    <motion.div key="prompts" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        {purchasedPrompts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Nenhum prompt ainda</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Explore a galeria e desbloqueie seus primeiros prompts</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 16 }}>
                                {purchasedPrompts.map(prompt => (
                                    <motion.div key={prompt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ padding: 20, borderRadius: 16, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                        <img src={prompt.imageUrl} alt={prompt.title} style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>{prompt.title}</h3>
                                                <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Desbloqueado</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} color={s <= Math.round(prompt.rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)'} fill={s <= Math.round(prompt.rating) ? '#fbbf24' : 'transparent'} />)}
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{prompt.rating}</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400, fontFamily: 'monospace' }}>
                                                {prompt.prompt.slice(0, 80)}...
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <motion.button onClick={() => copyPrompt(prompt.prompt, prompt.id)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                    background: copied === prompt.id ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${copied === prompt.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                                    color: copied === prompt.id ? '#10b981' : 'rgba(255,255,255,0.6)',
                                                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
                                                }}
                                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            >
                                                {copied === prompt.id ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                                            </motion.button>
                                            <motion.button onClick={() => setRevealPrompt(prompt)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                    background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)',
                                                    color: '#9333ea', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
                                                }}
                                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            >
                                                <BookOpen size={13} /> Ver
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'purchases' && (
                    <motion.div key="purchases" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        {confirmedPurchases.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Nenhuma compra ainda</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {confirmedPurchases.map(purchase => {
                                    const prompt = prompts.find(p => p.id === purchase.promptId)
                                    return (
                                        <div key={purchase.id} style={{ padding: '16px 20px', borderRadius: 12, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: 'white', marginBottom: 4 }}>{prompt?.title || 'Prompt'}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                                    <Calendar size={12} />
                                                    {formatDate(purchase.createdAt)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>R$ {purchase.amount.toFixed(2).replace('.', ',')}</div>
                                                <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Confirmado</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'subscription' && (
                    <motion.div key="subscription" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ maxWidth: 600 }}
                    >
                        <div style={{ background: '#0f0f1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', padding: 32, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: subscription?.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={24} color={subscription?.status === 'active' ? '#10b981' : '#ef4444'} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Assinatura VIP Pro</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                                            background: subscription?.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: subscription?.status === 'active' ? '#10b981' : '#ef4444',
                                            border: `1px solid ${subscription?.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                                        }}>
                                            {subscription?.status === 'active' ? '● Ativa' : '● Inativa'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {subscription?.status === 'active' && subscription?.expiry ? (() => {
                                const expiryDate = new Date(subscription.expiry)
                                const now = new Date()
                                const diffMs = expiryDate.getTime() - now.getTime()
                                const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
                                const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)) % 24)

                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <Clock size={16} color="#10b981" />
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Tempo Restante</span>
                                            </div>
                                            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{daysLeft} <span style={{ fontSize: 14, fontWeight: 600 }}>dias</span></div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>e {hoursLeft} horas</div>
                                        </div>

                                        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(147,51,234,0.05)', border: '1px solid rgba(147,51,234,0.15)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <Calendar size={16} color="#9333ea" />
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Expira em</span>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                                                {expiryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                                às {expiryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })() : (
                                <div style={{ padding: '40px 20px', textAlign: 'center', marginBottom: 24, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Sem assinatura ativa</div>
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Assine o plano VIP Pro para ter acesso ilimitado a todos os prompts</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12 }}>
                                {subscription?.status === 'active' ? (
                                    <motion.button
                                        onClick={() => setShowSubModal(true)}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: 12,
                                            background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.3)',
                                            color: '#9333ea', fontWeight: 700, fontSize: 14,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        <RefreshCw size={16} /> Renovar Assinatura
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        onClick={() => setShowSubModal(true)}
                                        style={{
                                            flex: 1, padding: '16px', borderRadius: 12,
                                            background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                            border: 'none', color: 'white', fontWeight: 700, fontSize: 15,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(147,51,234,0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Zap size={18} /> Assinar VIP Pro — R$ 49,90
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Benefits */}
                        <div style={{ background: '#0f0f1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', padding: 32 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 20 }}>Benefícios do Plano VIP Pro</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { icon: '🚀', text: 'Downloads ilimitados de todos os prompts' },
                                    { icon: '⚡', text: 'Acesso antecipado a novos prompts VIP' },
                                    { icon: '🛡️', text: 'Suporte prioritário via WhatsApp' },
                                    { icon: '🎨', text: 'Prompts exclusivos não disponíveis avulso' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {tab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ maxWidth: 500 }}
                    >
                        <div style={{ background: '#0f0f1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', padding: 32 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 24 }}>Configurações da Conta</h2>

                            {saveStatus && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 14,
                                        background: saveStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                        color: saveStatus.type === 'success' ? '#10b981' : '#ef4444'
                                    }}
                                >
                                    {saveStatus.msg}
                                </motion.div>
                            )}

                            <form onSubmit={handleUpdateProfile} style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Nome de Exibição</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input value={newName} onChange={e => setNewName(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none' }} />
                                    <motion.button type="submit" disabled={loadingSettings}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #9333ea, #3b82f6)', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: loadingSettings ? 'not-allowed' : 'pointer' }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        {loadingSettings ? '...' : 'Salvar'}
                                    </motion.button>
                                </div>
                            </form>

                            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />

                            <form onSubmit={handleUpdatePassword}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Alterar Senha</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none' }} />
                                    <motion.button type="submit" disabled={loadingSettings}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 700, cursor: loadingSettings ? 'not-allowed' : 'pointer' }}
                                        whileHover={{ background: 'rgba(255,255,255,0.12)' }} whileTap={{ scale: 0.98 }}
                                    >
                                        {loadingSettings ? '...' : 'Atualizar'}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PromptRevealModal prompt={revealPrompt} purchaseId={null} onClose={() => setRevealPrompt(null)} />
            {showSubModal && <SubModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} />}
        </div>
    )
}
