import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap, Rocket, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function SubModal({ isOpen, onClose }: Props) {
    const { user, supabase } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubscribe = async () => {
        if (!user) return
        setLoading(true)

        try {
            // Simulated subscription for now - in production this would call MP Preapproval API
            const { error } = await supabase.rpc('activate_subscription', {
                p_user_id: user.uid,
                p_preapproval_id: 'sub_' + Math.random().toString(36).substr(2, 9),
                p_days: 30
            })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                window.location.reload() // Reload to refresh all prompt status
            }, 2000)
        } catch (err) {
            console.error('Subscription error:', err)
            alert('Erro ao processar assinatura. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1200,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#0f0f1a',
                            border: '1px solid rgba(147,51,234,0.3)',
                            borderRadius: 24, padding: 32,
                            maxWidth: 500, width: '100%',
                            textAlign: 'center', position: 'relative',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 40px rgba(147,51,234,0.1)'
                        }}
                    >
                        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        {success ? (
                            <div style={{ padding: '20px 0' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Check size={40} color="#10b981" />
                                </div>
                                <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Assinatura Ativada!</h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
                                    Parabéns! Você agora tem acesso ilimitado a todos os prompts. Recarregando...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(147,51,234,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <Zap size={30} color="#9333ea" />
                                </div>

                                <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Seja VIP Pro</h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
                                    Acesso total e imediato à maior biblioteca de prompts ChatGPT do Brasil.
                                </p>

                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, marginBottom: 32, textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <span style={{ color: 'white', fontWeight: 600 }}>Plano 30 Dias</span>
                                        <span style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>R$ 49,90</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { icon: <Rocket size={16} />, text: "Downloads ilimitados instantâneos" },
                                            { icon: <Zap size={16} />, text: "Acesso a novos prompts VIP" },
                                            { icon: <ShieldCheck size={16} />, text: "Suporte prioritário" }
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                                                <div style={{ color: '#9333ea' }}>{item.icon}</div>
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', fontWeight: 700, fontSize: 16,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 20px rgba(147,51,234,0.3)' } : {}}
                                >
                                    {loading ? 'Processando...' : 'Confirmar Assinatura'}
                                </motion.button>

                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
                                    Ao clicar em confirmar, você terá acesso imediato por 30 dias.
                                </p>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
