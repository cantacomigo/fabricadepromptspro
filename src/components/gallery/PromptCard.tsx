import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Flame, Lock, ShoppingCart, Award, Heart, Plus, Check } from 'lucide-react'
import type { Prompt } from '../../lib/data'
import { usePrompts } from '../../contexts/PromptsContext'
import { useCart } from '../../contexts/CartContext'

interface Props {
    prompt: Prompt
    onUnlock: (prompt: Prompt) => void
    isPurchased?: boolean
    onViewImage: (url: string) => void
}

export default function PromptCard({ prompt, onUnlock, isPurchased = false, onViewImage }: Props) {
    const { toggleLike, userLikes } = usePrompts()
    const { addToCart, isInCart, setCartOpen } = useCart()
    const [hovered, setHovered] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)

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

    const categoryColors: Record<string, string> = {
        'Sci-Fi': '#3b82f6',
        'Fantasia': '#9333ea',
        'Dark Fantasy': '#ec4899',
        'Steampunk': '#f59e0b',
        'Natureza': '#10b981',
        'Arquitetura': '#06b6d4',
        'Espaço': '#8b5cf6',
    }
    const catColor = categoryColors[prompt.category] || '#9333ea'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#0f0f1a',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${catColor}30` : '0 4px 20px rgba(0,0,0,0.4)',
                borderColor: hovered ? `${catColor}50` : 'rgba(255,255,255,0.07)'
            }}
        >
            {/* Image */}
            <div
                style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/5' }}
                onClick={(e) => {
                    e.stopPropagation()
                    onViewImage(prompt.imageUrl)
                }}
            >
                <motion.img
                    src={prompt.imageUrl}
                    alt={prompt.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                    animate={{ scale: hovered ? 1.06 : 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {/* Overlay gradient */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, rgba(5,5,8,0.3) 40%, transparent 70%)',
                    transition: 'opacity 0.3s'
                }} />

                {/* Badges */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
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

                {/* Like Button */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
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

                {/* Image badges and status handles here */}
                {isPurchased && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        ✓ Desbloqueado
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '16px 16px 20px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                    {prompt.title}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {prompt.description}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={11}
                                    color={s <= Math.round(prompt.rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                                    fill={s <= Math.round(prompt.rating) ? '#fbbf24' : 'transparent'}
                                />
                            ))}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>({prompt.ratingCount})</span>
                        </div>
                    </div>
                    {/* Sales + Likes row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f97316' }}>
                            <Flame size={12} />
                            {prompt.salesCount} vendas
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                            <Heart size={12} fill="#ef4444" strokeWidth={0} />
                            {prompt.likesCount}
                        </div>
                    </div>
                </div>

                {/* Price + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Apenas</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                            R$ {prompt.price.toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (isPurchased) {
                                onUnlock(prompt)
                            } else if (isInCart(prompt.id)) {
                                setCartOpen(true)
                            } else {
                                addToCart(prompt)
                            }
                        }}
                        style={{
                            flex: 1, maxWidth: 160, padding: '11px 16px', borderRadius: 10,
                            background: isPurchased || isInCart(prompt.id) ? 'rgba(147,51,234,0.1)' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
                            border: isPurchased || isInCart(prompt.id) ? '1px solid rgba(147,51,234,0.3)' : 'none',
                            color: isPurchased || isInCart(prompt.id) ? '#9333ea' : 'white',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                        whileHover={{ scale: 1.03, boxShadow: isPurchased || isInCart(prompt.id) ? 'none' : '0 0 25px rgba(147,51,234,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {isPurchased ? (
                            <><Award size={14} /> Ver Prompt</>
                        ) : isInCart(prompt.id) ? (
                            <><Check size={14} /> No Carrinho</>
                        ) : (
                            <><Plus size={14} /> Adicionar</>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
