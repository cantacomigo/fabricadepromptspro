import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Loader2 } from 'lucide-react'
import type { Prompt } from '../../lib/data'
import { useAuth } from '../../contexts/AuthContext'
import MercadoPagoCheckout from './MercadoPagoCheckout'

interface Props {
    items: Prompt[]
    onClose: () => void
    onSuccess: (purchaseIds: string[]) => void
}

export default function PixPaymentModal({ items, onClose, onSuccess }: Props) {
    const { createMPPreference, supabase } = useAuth()
    const [mpLoading, setMpLoading] = useState(false)
    const [mpError, setMpError] = useState<string | null>(null)
    const [status, setStatus] = useState<'pending' | 'confirmed'>('pending')
    const [preferenceId, setPreferenceId] = useState<string | null>(null)
    const [confirmedPurchaseIds, setConfirmedPurchaseIds] = useState<string[]>([])
    const isProcessing = useRef(false)
    const [pollingActive, setPollingActive] = useState(false)

    const totalPrice = items.reduce((acc, item) => acc + item.price, 0)

    const handleMPCheckout = useCallback(async () => {
        if (!items.length || isProcessing.current || preferenceId) return
        isProcessing.current = true

        setMpLoading(true)
        setMpError(null)

        try {
            const { preferenceId: prefId, purchaseIds } = await createMPPreference(items)
            setPreferenceId(prefId)
            setConfirmedPurchaseIds(purchaseIds)
            setPollingActive(true)
        } catch (err: any) {
            console.error('Mercado Pago Init failed', err)
            setMpError('Falha ao gerar link de pagamento. Tente novamente.')
        } finally {
            setMpLoading(false)
            isProcessing.current = false
        }
    }, [items, preferenceId, createMPPreference])

    useEffect(() => {
        handleMPCheckout()
    }, [handleMPCheckout])

    const checkPaymentStatus = useCallback(async (e?: React.MouseEvent | boolean) => {
        const silent = typeof e === 'boolean' ? e : false
        if (e && typeof e !== 'boolean') e.stopPropagation()
        if (!preferenceId || (status === 'confirmed' && !silent)) return

        if (!silent) setMpLoading(true)
        setMpError(null)

        try {
            const { data, error: rpcError } = await supabase.rpc('check_mp_payment_status_rpc', {
                payload: { preference_id: preferenceId }
            })

            if (rpcError) throw rpcError

            if (data.status === 'approved') {
                setStatus('confirmed')
                setPollingActive(false)

                // Trigger success callback with real purchase IDs
                onSuccess(confirmedPurchaseIds.length > 0 ? confirmedPurchaseIds : items.map(i => i.id))

                setTimeout(() => {
                    onClose()
                }, 2000)
            } else if (data.status === 'error') {
                if (!silent) setMpError(`Erro na verificação: ${data.message || 'Erro de rede no banco'}. Tente novamente em alguns segundos.`)
            } else {
                if (!silent) setMpError('Pagamento ainda não detectado. Se você já pagou, aguarde 1 minuto e tente novamente.')
            }
        } catch (err: any) {
            console.error('Status check failed', err)
            if (!silent) setMpError(`Falha na conexão: ${err.message || 'Verifique sua internet'}`)
        } finally {
            if (!silent) setMpLoading(false)
        }
    }, [preferenceId, status, confirmedPurchaseIds, items, onSuccess, onClose, supabase])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (pollingActive && status === 'pending') {
            interval = setInterval(() => {
                checkPaymentStatus(true)
            }, 5000)
        }
        return () => { if (interval) clearInterval(interval) }
    }, [pollingActive, status, checkPaymentStatus])

    return (
        <AnimatePresence>
            {items.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1100,
                        background: 'rgba(0,0,0,0.9)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 20
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#0f0f1a',
                            border: status === 'confirmed'
                                ? '1px solid rgba(16,185,129,0.4)'
                                : '1px solid rgba(0,158,229,0.4)',
                            borderRadius: 20, padding: 32,
                            maxWidth: 420, width: '100%',
                            boxShadow: status === 'confirmed'
                                ? '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(16,185,129,0.2)'
                                : '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(0,158,229,0.2)'
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {status === 'confirmed' ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', padding: '20px 0' }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ duration: 0.6 }}
                                        style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
                                    >
                                        <CheckCircle2 size={64} color="#10b981" />
                                    </motion.div>
                                    <h2 style={{ color: '#10b981', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
                                        Pagamento Confirmado!
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
                                        {items.length > 1 ? `${items.length} prompts foram desbloqueados.` : 'Seu prompt foi desbloqueado.'} Redirecionando...
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#009ee5' }} className="animate-pulse-neon" />
                                                <span style={{ fontSize: 13, color: '#009ee5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Checkout Seguro
                                                </span>
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'white' }}> Pagamento </h2>
                                        </div>
                                        <motion.button onClick={onClose}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 6 }}
                                            whileHover={{ color: 'white' }}
                                        >
                                            <X size={18} />
                                        </motion.button>
                                    </div>

                                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Total</span>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: 'white', whiteSpace: 'nowrap' }}>
                                                R$ {totalPrice.toFixed(2).replace('.', ',')}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {mpLoading && !preferenceId ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                                <Loader2 size={32} color="#009ee5" className="animate-spin" />
                                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Iniciando Mercado Pago...</span>
                                            </div>
                                        ) : preferenceId ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                                                <MercadoPagoCheckout preferenceId={preferenceId} />

                                                {mpError && (
                                                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 12, color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
                                                        {mpError}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={checkPaymentStatus}
                                                    disabled={mpLoading}
                                                    style={{
                                                        width: '100%', padding: '12px', borderRadius: 12,
                                                        background: 'rgba(0,158,229,0.1)', border: '1px solid rgba(0,158,229,0.4)',
                                                        color: '#009ee5', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {mpLoading ? <Loader2 size={16} className="animate-spin" /> : 'Já paguei! Verificar aprovação'}
                                                </button>
                                            </div>
                                        ) : mpError ? (
                                            <div style={{ textAlign: 'center', padding: 20 }}>
                                                <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{mpError}</div>
                                                <button onClick={handleMPCheckout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}> Tentar novamente </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
