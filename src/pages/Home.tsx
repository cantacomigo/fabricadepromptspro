import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { usePrompts } from '../contexts/PromptsContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import PromptCard from '../components/gallery/PromptCard'
import UnlockModal from '../components/modals/UnlockModal'
import PixPaymentModal from '../components/modals/PixPaymentModal'
import PromptRevealModal from '../components/modals/PromptRevealModal'
import ImageLightbox from '../components/modals/ImageLightbox'
import CartDrawer from '../components/cart/CartDrawer'
import type { Prompt } from '../lib/data'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const { prompts, categories, incrementSales, totalSystemSales } = usePrompts()
    const { hasPurchased, confirmPurchase } = useAuth()
    const { cartItems, setCartOpen, clearCart } = useCart()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('Todos')
    const [selected, setSelected] = useState<Prompt | null>(null)
    const [showPix, setShowPix] = useState(false)
    const [revealPrompt, setRevealPrompt] = useState<Prompt | null>(null)
    const [lastPurchaseId, setLastPurchaseId] = useState<string | null>(null)
    const [viewImage, setViewImage] = useState<string | null>(null)
    const [isCartCheckout, setIsCartCheckout] = useState(false)

    const displayCategories = useMemo(() => ['Todos', ...categories], [categories])

    const filtered = useMemo(() => {
        return prompts.filter(p => {
            const matchCat = category === 'Todos' || p.category === category
            const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
            return matchCat && matchSearch
        })
    }, [prompts, category, search])

    const totalSales = totalSystemSales
    const avgRating = prompts.length > 0
        ? (prompts.reduce((a, p) => a + p.rating, 0) / prompts.length).toFixed(1)
        : '0.0'

    const handleUnlock = (prompt: Prompt) => {
        if (hasPurchased(prompt.id)) {
            setRevealPrompt(prompt)
            return
        }
        setSelected(prompt)
        setShowPix(false)
    }

    const handleCartCheckout = async () => {
        setIsCartCheckout(true)
        setSelected(null)
        setShowPix(true)
        setCartOpen(false)
    }

    const handlePaySuccess = async (purchaseIds: string[]) => {
        try {
            // Mark all items as confirmed in the DB
            for (const id of purchaseIds) {
                await confirmPurchase(id)
            }

            setCartOpen(false)
            clearCart()
            alert('Parabéns! Seus prompts foram desbloqueados. Você já pode visualizá-los na galeria.')
        } catch (err) {
            console.error('Error confirming purchase:', err)
            alert('Houve um problema ao liberar seu prompt. Por favor, entre em contato com o suporte.')
        }
        setShowPix(false)
        setSelected(null)
        setIsCartCheckout(false)
    }

    const staggerChildren = { animate: { transition: { staggerChildren: 0.06 } } }

    return (
        <div>
            {/* Hero Section */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                padding: '80px 24px 60px',
                background: 'radial-gradient(ellipse at 20% 0%, rgba(147,51,234,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)'
            }}>
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.03,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', marginBottom: 24 }}>
                            <Sparkles size={14} color="#9333ea" />
                            <span style={{ fontSize: 13, color: '#9333ea', fontWeight: 600 }}>+{totalSales} prompts vendidos</span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, color: 'white', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: -1 }}>
                            Prompts de IA que {' '}
                            <span style={{ background: 'linear-gradient(135deg, #9333ea, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                transformam ideias
                            </span>{' '}
                            em obras-primas
                        </h1>

                        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.5)', margin: '0 auto 36px', maxWidth: 560, lineHeight: 1.7 }}>
                            Desbloqueie prompts premium testados e aprovados para criar imagens extraordinárias com Midjourney, DALL-E e Stable Diffusion.
                        </p>

                        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
                            <Search size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por estilo, tema..."
                                style={{
                                    width: '100%', padding: '14px 14px 14px 46px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 40, flexWrap: 'wrap' }}
                    >
                        {[
                            { icon: <Sparkles size={16} />, value: `${prompts.length}+`, label: 'Prompts Premium' },
                            { icon: <TrendingUp size={16} />, value: `${totalSales}+`, label: 'Vendidos' },
                            { icon: <Zap size={16} />, value: `${avgRating}★`, label: 'Avaliação Média' },
                        ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#9333ea', marginBottom: 4 }}>
                                    {stat.icon}
                                    <span style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{stat.value}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
                    {displayCategories.map(cat => (
                        <motion.button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            style={{
                                padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                background: category === cat ? 'linear-gradient(135deg, #9333ea, #3b82f6)' : 'rgba(255,255,255,0.05)',
                                border: category === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                color: category === cat ? 'white' : 'rgba(255,255,255,0.6)',
                                transition: 'all 0.2s'
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
                    {filtered.length} {filtered.length === 1 ? 'prompt encontrado' : 'prompts encontrados'}
                    {search && ` para "${search}"`}
                </div>

                <AnimatePresence mode="wait">
                    {filtered.length > 0 ? (
                        <motion.div
                            key={category + search}
                            variants={staggerChildren}
                            initial="initial"
                            animate="animate"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: 20
                            }}
                        >
                            {filtered.map(prompt => (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    onUnlock={handleUnlock}
                                    isPurchased={hasPurchased(prompt.id)}
                                    onViewImage={setViewImage}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 20px' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                            <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Nenhum prompt encontrado</div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Tente outra categoria ou termo de busca</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals & Cart */}
            <CartDrawer onCheckout={handleCartCheckout} />

            <UnlockModal
                prompt={!showPix ? selected : null}
                onClose={() => setSelected(null)}
                onPay={() => setShowPix(true)}
            />

            <PixPaymentModal
                items={isCartCheckout ? cartItems : (selected ? [selected] : [])}
                onClose={() => { setShowPix(false); setSelected(null); setIsCartCheckout(false) }}
                onSuccess={handlePaySuccess}
            />

            <PromptRevealModal
                prompt={revealPrompt}
                purchaseId={lastPurchaseId}
                onClose={() => { setRevealPrompt(null); setLastPurchaseId(null) }}
            />

            <ImageLightbox
                imageUrl={viewImage}
                onClose={() => setViewImage(null)}
            />
        </div>
    )
}
