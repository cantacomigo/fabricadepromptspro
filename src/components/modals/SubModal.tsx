import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap, Rocket, ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import MercadoPagoCheckout from './MercadoPagoCheckout'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function SubModal({ isOpen, onClose }: Props) {
    const { user, supabase, createMPPreference } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [preferenceId, setPreferenceId] = useState<string | null>(null)
    const [purchaseId, setPurchaseId] = useState<string | null>(null)
    const [mpError, setMpError] = useState<string | null>(null)
    const [pollingActive, setPollingActive] = useState(false)

    const handleSubscribe = async () => {
        if (!user) return
        setLoading(true)
        setMpError(null)

        try {
            const vipPrompt = {
                id: '00000000-0000-0000-0000-000000000001',
                title: 'Assinatura VIP PRO (30 Dias)',
                price: 49.90,
                description: 'Acesso ilimitado a todos os prompts',
                category: 'VIP',
                prompt: 'VIP',
                imageUrl: '',
                salesCount: 0,
                likesCount: 0,
                rating: 5,
                ratingCount: 0,
                createdAt: Date.now(),
                tags: ['vip', 'pro']
            }

            const { preferenceId: prefId, purchaseIds } = await createMPPreference([vipPrompt])
            setPreferenceId(prefId)
            setPurchaseId(purchaseIds[0] || null)
            setPollingActive(true)
        } catch (err: any) {
            console.error('Subscription error:', err)
            setMpError(`Erro: ${err?.message || err?.details || JSON.stringify(err)}`)
        } finally {
            setLoading(false)
        }
    }

    const checkStatus = useCallback(async (silent: boolean = false) => {
        if ((!preferenceId && !purchaseId) || success) return
        if (!silent) setLoading(true)
        setMpError(null)

        try {
            const { data, error } = await supabase.rpc('check_mp_payment_status_rpc', {
                payload: {
                    purchase_id: purchaseId,
                    preference_id: preferenceId
                }
            })

            if (error) {
                console.error('RPC error:', error)
                if (!silent) setMpError('Erro na verificação: ' + error.message)
                return
            }

            if (data?.status === 'approved') {
                setSuccess(true)
                setPollingActive(false)
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else if (!silent) {
                const debugInfo = data?.debug_url ? ` [ref: ${data.debug_url.split('external_reference=')[1]?.substring(0, 8) || '?'}]` : ''
                setMpError(`Pagamento ainda não detectado (status: ${data?.status || 'unknown'})${debugInfo}. Aguarde alguns segundos...`)
            }
        } catch (err: any) {
            console.error('Status check error:', err)
            if (!silent) setMpError('Falha na conexão: ' + (err.message || 'Verifique sua internet'))
        } finally {
            if (!silent) setLoading(false)
        }
    }, [preferenceId, purchaseId, success, supabase])

    // Automatic polling every 5 seconds
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (pollingActive && !success) {
            interval = setInterval(() => {
                checkStatus(true)
            }, 5000)
        }
        return () => { if (interval) clearInterval(interval) }
    }, [pollingActive, success, checkStatus])

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

                                {preferenceId ? (
                                    <div style={{ padding: '20px 0' }}>
                                        <MercadoPagoCheckout preferenceId={preferenceId} />

                                        {pollingActive && !mpError && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                                <Loader2 size={14} className="animate-spin" />
                                                Verificando pagamento automaticamente...
                                            </div>
                                        )}

                                        {mpError && (
                                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 12, color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
                                                {mpError}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => checkStatus(false)}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: 12,
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
                                                color: '#10b981', fontWeight: 700, fontSize: 15,
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                marginTop: 16,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                            }}
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Já paguei! Ativar Agora'}
                                        </button>

                                        <button
                                            onClick={() => { setPreferenceId(null); setPollingActive(false) }}
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16, cursor: 'pointer' }}
                                        >
                                            Alterar forma de pagamento
                                        </button>
                                    </div>
                                ) : (
                                    <>
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

                                        {mpError && (
                                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 12, color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                                                {mpError}
                                            </div>
                                        )}

                                        <motion.button
                                            onClick={handleSubscribe}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: 12,
                                                background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                                border: 'none', color: 'white', fontWeight: 700, fontSize: 16,
                                                cursor: loading ? 'not-allowed' : 'pointer'
                                            }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(147,51,234,0.3)' }}
                                        >
                                            {loading ? 'Iniciando...' : 'Assinar com Mercado Pago'}
                                        </motion.button>

                                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
                                            Você será redirecionado para o pagamento seguro do Mercado Pago.
                                        </p>
                                    </>
                                )}
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
