import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Flame, Award, Lock, Heart } from 'lucide-react'
import type { Prompt } from '../../lib/data'
import { usePrompts } from '../../contexts/PromptsContext'
import { useState } from 'react'

interface Props {
    prompt: Prompt | null
    onClose: () => void
    onPay: () => void
}

export default function UnlockModal({ prompt, onClose, onPay }: Props) {
    const { toggleLike, userLikes } = usePrompts()
    const [likeLoading, setLikeLoading] = useState(false)

    if (!prompt) return null

    const isLiked = userLikes.includes(prompt.id)

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (likeLoading) return
        setLikeLoading(true)
        try {
            await toggleLike(prompt.id)
        } catch (err) {
            alert('Erro ao curtir: ' + (err as Error).message)
        } finally {
            setLikeLoading(false)
        }
    }

    const tempValue = (prompt.salesCount * 1.5) + prompt.likesCount
    const getTempBadge = () => {
        if (tempValue > 100) return { label: 'VIRAL', icon: <Flame size={10} />, color: '#ef4444' }
        if (tempValue > 50) return { label: 'POPULAR', icon: <Flame size={10} />, color: '#f97316' }
        if (tempValue > 20) return { label: 'EM ALTA', icon: <Flame size={10} />, color: '#fbbf24' }
        return null
    }
    const tempBadge = getTempBadge()
    return (
        <AnimatePresence>
            {prompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 20
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#0f0f1a',
                            border: '1px solid rgba(147,51,234,0.3)',
                            borderRadius: 20,
                            overflow: 'hidden',
                            maxWidth: 520,
                            width: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(147,51,234,0.2)'
                        }}
                    >
                        {/* Image */}
                        <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', flexShrink: 1, maxHeight: '45vh' }}>
                            <img src={prompt.imageUrl} alt={prompt.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'rgba(255,255,255,0.02)' }} />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to top, #0f0f1a 0%, transparent 60%)'
                            }} />

                            {/* Close */}
                            <motion.button
                                onClick={onClose}
                                style={{
                                    position: 'absolute', top: 12, right: 12,
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.8)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X size={18} />
                            </motion.button>

                            {/* Badges on image */}
                            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{
                                    padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                    color: 'white', textTransform: 'uppercase', letterSpacing: 1,
                                    display: 'flex', alignItems: 'center', gap: 4
                                }}>
                                    <Award size={10} /> PREMIUM
                                </div>

                                {tempBadge && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        style={{
                                            padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                            background: 'rgba(15,15,26,0.8)',
                                            backdropFilter: 'blur(4px)',
                                            color: tempBadge.color,
                                            border: `1px solid ${tempBadge.color}50`,
                                            textTransform: 'uppercase', letterSpacing: 1,
                                            display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content'
                                        }}
                                    >
                                        {tempBadge.icon} {tempBadge.label}
                                    </motion.div>
                                )}
                            </div>

                            {/* Like Button on modal */}
                            <div style={{ position: 'absolute', top: 12, right: 60, zIndex: 10 }}>
                                <motion.button
                                    onClick={handleLike}
                                    style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: isLiked ? 'rgba(239,68,68,0.2)' : 'rgba(15,15,26,0.6)',
                                        backdropFilter: 'blur(8px)',
                                        border: `1px solid ${isLiked ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                        color: isLiked ? '#ef4444' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', outline: 'none'
                                    }}
                                    whileHover={{ scale: 1.1, background: isLiked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Heart size={18} fill={isLiked ? '#ef4444' : 'transparent'} strokeWidth={isLiked ? 0 : 2} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px 28px 28px', overflowY: 'auto', flex: 1 }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'white' }}>
                                {prompt.title}
                            </h2>
                            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                {prompt.description}
                            </p>

                            {/* Stats */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={13}
                                            color={s <= Math.round(prompt.rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                                            fill={s <= Math.round(prompt.rating) ? '#fbbf24' : 'transparent'} />
                                    ))}
                                    <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginLeft: 4 }}>{prompt.rating}</span>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>({prompt.ratingCount} avaliações)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f97316' }}>
                                        <Flame size={14} /> {prompt.salesCount} vendas
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                                        <Heart size={14} fill="#ef4444" strokeWidth={0} /> {prompt.likesCount} curtidas
                                    </div>
                                </div>
                            </div>

                            {/* Locked prompt preview */}
                            <div style={{
                                marginBottom: 24, padding: 16, borderRadius: 12,
                                background: 'rgba(147,51,234,0.06)',
                                border: '1px solid rgba(147,51,234,0.2)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Lock size={14} color="#9333ea" />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9333ea', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prompt Bloqueado</span>
                                </div>
                                <div style={{ filter: 'blur(4px)', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, userSelect: 'none' }}>
                                    {prompt.prompt.slice(0, 100)}...
                                </div>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to bottom, transparent 30%, rgba(15,15,26,0.8))',
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12
                                }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Desbloqueie para ver o prompt completo</span>
                                </div>
                            </div>

                            {/* Price + CTA */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Valor único</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>
                                        R$ {prompt.price.toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onPay}
                                    style={{
                                        flex: 1, padding: '14px 24px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', fontSize: 15, fontWeight: 700,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(147,51,234,0.6)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    💳 Pagar com Pix
                                </motion.button>
                            </div>

                            <p style={{ margin: '14px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                                🔒 Pagamento seguro • Acesso imediato após confirmação
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
