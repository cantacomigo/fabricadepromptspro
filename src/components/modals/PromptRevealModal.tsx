import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Star } from 'lucide-react'
import type { Prompt } from '../../lib/data'
import { useAuth } from '../../contexts/AuthContext'
import { usePrompts } from '../../contexts/PromptsContext'

interface Props {
    prompt: Prompt | null
    purchaseId: string | null
    onClose: () => void
}

export default function PromptRevealModal({ prompt, purchaseId: _pid, onClose }: Props) {
    const { hasPurchased } = useAuth()
    const { ratePrompt } = usePrompts()
    const [copied, setCopied] = useState(false)
    const [userRating, setUserRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [rated, setRated] = useState(false)
    const [displayed, setDisplayed] = useState('')
    const isUnlocked = prompt ? hasPurchased(prompt.id) : false

    // Typewriter effect
    useEffect(() => {
        if (!prompt || !isUnlocked) return
        setDisplayed('')
        let i = 0
        const interval = setInterval(() => {
            if (i < prompt.prompt.length) {
                setDisplayed(prompt.prompt.slice(0, i + 1))
                i++
            } else {
                clearInterval(interval)
            }
        }, 8)
        return () => clearInterval(interval)
    }, [prompt, isUnlocked])

    const copy = async () => {
        if (!prompt) return
        await navigator.clipboard.writeText(prompt.prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRate = (r: number) => {
        if (rated || !prompt) return
        setUserRating(r)
        setRated(true)
        ratePrompt(prompt.id, r)
    }

    return (
        <AnimatePresence>
            {prompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1200,
                        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#0f0f1a',
                            border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 20,
                            maxWidth: 560, width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(16,185,129,0.15)'
                        }}
                    >
                        {/* Scrollable Content Container */}
                        <div style={{ padding: 32 }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>✓ Prompt Desbloqueado</div>
                                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'white' }}>{prompt.title}</h2>
                                </div>
                                <motion.button onClick={onClose}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 6 }}
                                    whileHover={{ color: 'white' }}
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Image preview */}
                            <img src={prompt.imageUrl} alt={prompt.title}
                                style={{ width: '100%', maxHeight: '35vh', objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />

                            {/* Prompt text */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Prompt Completo</div>
                                <div style={{
                                    padding: '16px 18px', borderRadius: 12,
                                    background: 'rgba(16,185,129,0.05)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)',
                                    fontFamily: 'monospace', minHeight: 100,
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                                }}>
                                    {isUnlocked ? displayed : prompt.prompt}
                                    {isUnlocked && displayed.length < prompt.prompt.length && (
                                        <span style={{ opacity: 0.4 }}>|</span>
                                    )}
                                </div>
                            </div>

                            {/* Copy button */}
                            <motion.button
                                onClick={copy}
                                style={{
                                    width: '100%', padding: '13px', borderRadius: 12, marginBottom: 24,
                                    background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                    color: copied ? '#10b981' : 'rgba(255,255,255,0.8)',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {copied ? <><Check size={16} /> Copiado com sucesso!</> : <><Copy size={16} /> Copiar Prompt</>}
                            </motion.button>

                            {/* Step-by-Step Instructions */}
                            <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: 'rgba(147,51,234,0.05)', border: '1px solid rgba(147,51,234,0.2)' }}>
                                <div style={{ fontSize: 13, color: '#9333ea', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Star size={14} fill="#9333ea" /> Instruções Passo a Passo
                                </div>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                                    {prompt.instructions || (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <span style={{ color: '#9333ea', fontWeight: 800 }}>1.</span>
                                                <span>Abra o seu <b>ChatGPT</b> (preferencialmente versão Plus/GPT-4 para melhores resultados de imagem).</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <span style={{ color: '#9333ea', fontWeight: 800 }}>2.</span>
                                                <span>Cole o prompt copiado acima exatamente como está.</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <span style={{ color: '#9333ea', fontWeight: 800 }}>3.</span>
                                                <span>Caso queira ajustar, mude apenas os termos entre colchetes ou as palavras-chave principais.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rating */}
                            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                                    {rated ? '🙏 Obrigado pela avaliação!' : 'O que você achou deste prompt?'}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <motion.button
                                            key={s}
                                            onClick={() => handleRate(s)}
                                            onMouseEnter={() => !rated && setHoveredStar(s)}
                                            onMouseLeave={() => !rated && setHoveredStar(0)}
                                            style={{ background: 'none', border: 'none', cursor: rated ? 'default' : 'pointer', padding: 2 }}
                                            whileHover={!rated ? { scale: 1.2 } : {}}
                                            whileTap={!rated ? { scale: 0.9 } : {}}
                                        >
                                            <Star size={26}
                                                color={s <= (hoveredStar || userRating) ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                                                fill={s <= (hoveredStar || userRating) ? '#fbbf24' : 'transparent'}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
