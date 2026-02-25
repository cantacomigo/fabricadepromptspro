import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import type { Prompt } from '../../lib/data'
import { useAuth } from '../../contexts/AuthContext'
import { usePrompts } from '../../contexts/PromptsContext'

interface Props {
    items: Prompt[]
    onClose: () => void
    onSuccess: (purchaseIds: string[]) => void
}

export default function PixPaymentModal({ items, onClose, onSuccess }: Props) {
    const { purchaseMultiplePrompts, purchases } = useAuth()
    const { incrementSales } = usePrompts()
    const [purchaseIds, setPurchaseIds] = useState<string[]>([])
    const [copied, setCopied] = useState(false)
    const [timeLeft, setTimeLeft] = useState(900) // 15 min
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<'pending' | 'confirmed'>('pending')

    const totalPrice = items.reduce((acc, item) => acc + item.price, 0)
    const mainPurchaseId = purchaseIds[0] || ''

    // Gerar código Pix dinâmico (formato estático simplificado)
    const amountStr = totalPrice.toFixed(2)
    const amountLen = amountStr.length.toString().padStart(2, '0')
    const pixCode = mainPurchaseId
        ? `00020126580014BR.GOV.BCB.PIX0136${mainPurchaseId}52040000530398654${amountLen}${amountStr}5802BR5920Fabrica de Prompts6009SAOPAULO62070503***63042B3F`
        : ''

    const qrUrl = pixCode
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=0f0f1a&color=9333ea&data=${encodeURIComponent(pixCode)}`
        : ''

    // Start purchase when modal opens  
    const startPurchase = useCallback(async () => {
        if (items.length === 0 || purchaseIds.length > 0) return
        setLoading(true)
        setError(null)
        try {
            const ids = await purchaseMultiplePrompts(items.map(i => ({ id: i.id, price: i.price })))
            setPurchaseIds(ids)
        } catch (err: any) {
            console.error('Failed to start purchase', err)
            setError(err.message || 'Falha ao iniciar pagamento. Verifique se o SQL do Supabase foi rodado.')
        } finally {
            setLoading(false)
        }
    }, [items, purchaseIds, purchaseMultiplePrompts])

    useEffect(() => {
        startPurchase()
    }, [items.length, startPurchase])

    // Poll for payment confirmation
    useEffect(() => {
        if (purchaseIds.length === 0) return
        const interval = setInterval(() => {
            const relevantPurchases = purchases.filter(p => purchaseIds.includes(p.id))
            const allConfirmed = relevantPurchases.length > 0 && relevantPurchases.every(p => p.status === 'confirmed')

            if (allConfirmed) {
                setStatus('confirmed')
                clearInterval(interval)
                // Increment sales for all
                items.forEach(item => incrementSales(item.id))
                setTimeout(() => onSuccess(purchaseIds), 1500)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [purchaseIds, purchases, items, incrementSales, onSuccess])

    // Countdown
    useEffect(() => {
        if (status === 'confirmed') return
        const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000)
        return () => clearInterval(t)
    }, [status])

    const copy = async () => {
        await navigator.clipboard.writeText(pixCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

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
                                : '1px solid rgba(147,51,234,0.3)',
                            borderRadius: 20, padding: 32,
                            maxWidth: 420, width: '100%',
                            boxShadow: status === 'confirmed'
                                ? '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(16,185,129,0.2)'
                                : '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(147,51,234,0.2)'
                        }}
                    >
                        {/* Success state */}
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
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9333ea' }} className="animate-pulse-neon" />
                                                <span style={{ fontSize: 13, color: '#9333ea', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Aguardando Pagamento</span>
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'white' }}>Pagar via Pix</h2>
                                        </div>
                                        <motion.button onClick={onClose}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 6 }}
                                            whileHover={{ color: 'white' }}
                                        >
                                            <X size={18} />
                                        </motion.button>
                                    </div>

                                    {/* Summary */}
                                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                                        {items.length === 1 ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <img src={items[0].imageUrl} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{items[0].title}</div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Prompt Premium</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 8 }}>{items.length} itens no carrinho:</div>
                                                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                                    {items.map(item => (
                                                        <img key={item.id} src={item.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Total</span>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: 'white', whiteSpace: 'nowrap' }}>
                                                R$ {totalPrice.toFixed(2).replace('.', ',')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                        {loading ? (
                                            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Loader2 size={32} color="#9333ea" style={{ animation: 'spin 1s linear infinite' }} />
                                            </div>
                                        ) : error ? (
                                            <div style={{ width: 200, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center', background: 'rgba(239,68,68,0.05)', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                                                <X size={32} color="#ef4444" />
                                                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Erro ao gerar Pix</div>
                                                <button onClick={startPurchase} style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Tentar novamente</button>
                                            </div>
                                        ) : (
                                            <div style={{ padding: 16, background: '#0a0a12', borderRadius: 16, border: '1px solid rgba(147,51,234,0.3)' }}>
                                                <img src={qrUrl} alt="QR Code Pix" width={168} height={168} style={{ display: 'block', borderRadius: 8 }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pix copia e cola */}
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pix Copia e Cola</div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{
                                                flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 11,
                                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                                color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                fontFamily: 'monospace'
                                            }}>
                                                {pixCode || 'Gerando código...'}
                                            </div>
                                            <motion.button
                                                onClick={copy}
                                                style={{
                                                    padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                    background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(147,51,234,0.2)',
                                                    border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(147,51,234,0.4)'}`,
                                                    color: copied ? '#10b981' : '#9333ea', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
                                                }}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Timer */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: timeLeft < 60 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                                        <Clock size={14} /> Expira em {fmt(timeLeft)}
                                    </div>

                                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.15)', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.5 }}>
                                        💡 Após realizar o pagamento, aguarde a confirmação automática. O acesso ao prompt será liberado em instantes.
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
