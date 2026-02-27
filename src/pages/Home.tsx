import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, TrendingUp, Zap, Check } from 'lucide-react'
import { usePrompts } from '../contexts/PromptsContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useLocation } from 'react-router-dom'
import PromptCard from '../components/gallery/PromptCard'
import UnlockModal from '../components/modals/UnlockModal'
import PixPaymentModal from '../components/modals/PixPaymentModal'
import PromptRevealModal from '../components/modals/PromptRevealModal'
import SubModal from '../components/modals/SubModal'
import ImageLightbox from '../components/modals/ImageLightbox'
import CartDrawer from '../components/cart/CartDrawer'
import type { Prompt } from '../lib/data'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const { prompts, categories, incrementSales, totalSystemSales, refreshPrompts, loading } = usePrompts()
    const { hasPurchased, confirmPurchase } = useAuth()
    const { cartItems, setCartOpen, clearCart } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('Todos')
    const [selected, setSelected] = useState<Prompt | null>(null)
    const [showPix, setShowPix] = useState(false)
    const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null)
    const [showingSubscriptionModal, setShowingSubscriptionModal] = useState(false)
    const [lastPurchaseId, setLastPurchaseId] = useState<string | null>(null)
    const [viewImage, setViewImage] = useState<string | null>(null)
    const [isCartCheckout, setIsCartCheckout] = useState(false)

    // Handle initial scroll to hash
    useEffect(() => {
        if (location.hash === '#como-funciona') {
            const el = document.getElementById('como-funciona')
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }
        } else if (location.hash === '#precos') {
            const el = document.getElementById('precos')
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }
        }
    }, [location])

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
            setViewingPrompt(prompt)
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
            await refreshPrompts()
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
                            Desbloqueie prompts premium testados e aprovados para extrair o máximo poder do ChatGPT e gerar imagens extraordinárias com precisão profissional.
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

            {/* Main Gallery */}
            <div id="galeria" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
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

                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 20
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', height: 400 }}>
                                <div className="shimmer" style={{ aspectRatio: '4/5', background: 'rgba(255,255,255,0.03)', position: 'relative' }} />
                                <div style={{ padding: 16 }}>
                                    <div style={{ height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '70%', marginBottom: 10 }} />
                                    <div style={{ height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, width: '90%', marginBottom: 6 }} />
                                    <div style={{ height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, width: '40%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div
                        key={category + search}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: 20
                        }}
                    >
                        {filtered.map((prompt, index) => (
                            <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onUnlock={handleUnlock}
                                isPurchased={hasPurchased(prompt.id)}
                                onViewImage={setViewImage}
                                priority={index < 4}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Nenhum prompt encontrado</div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Tente outra categoria ou termo de busca</div>
                    </div>
                )}
            </div>

            {/* How it Works Section */}
            <div id="como-funciona" style={{ padding: '80px 24px', background: '#0a0a12', position: 'relative' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', margin: '0 0 16px' }}>
                            Como a Fábrica funciona?
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
                            Desbloqueie seu potencial criativo em 3 passos simples.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
                        {[
                            {
                                icon: <Search size={24} color="#9333ea" />,
                                title: "1. Explore e Escolha",
                                desc: "Navegue por nossa galeria curada de prompts premium testados exclusivamente para o ChatGPT."
                            },
                            {
                                icon: <Zap size={24} color="#3b82f6" />,
                                title: "2. Pagamento Instantâneo",
                                desc: "Use Pix para um checkout ultra-rápido. Liberação automática em menos de 5 segundos."
                            },
                            {
                                icon: <Sparkles size={24} color="#06b6d4" />,
                                title: "3. Copie e Gere",
                                desc: "Copie o prompt desbloqueado, cole no seu ChatGPT e gere imagens extraordinárias de nível profissional instantaneamente."
                            }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: 32, borderRadius: 20,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>
                                    {step.icon}
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>{step.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div id="precos" style={{ padding: '80px 24px', background: 'radial-gradient(circle at center, rgba(147,51,234,0.05) 0%, transparent 70%)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', margin: '0 0 16px' }}>
                            Preços Transparentes
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
                            Sem assinaturas complicadas. Pague apenas pelo que você precisa.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                        {/* Individual Prompt Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{
                                width: '100%', maxWidth: 400, padding: '40px 32px', borderRadius: 24,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                textAlign: 'center'
                            }}
                        >
                            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Prompt Individual</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
                                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>A partir de</span>
                                <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>R$</span>
                                <span style={{ fontSize: 48, fontWeight: 900, color: 'white' }}>4,90</span>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32 }}>
                                Perfeito para quem precisa de um empurrão específico para um projeto único.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32, textAlign: 'left' }}>
                                {[
                                    "Acesso Vitalício ao Prompt",
                                    "Instruções Passo a Passo",
                                    "Suporte via WhatsApp",
                                    "Sem Mensalidade"
                                ].map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                                        <Check size={16} color="#10b981" />
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                onClick={() => {
                                    const el = document.getElementById('galeria')
                                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                                }}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', fontWeight: 700, fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                                Explorar Galeria
                            </motion.button>
                        </motion.div>

                        {/* Pro Plan Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            style={{
                                width: '100%', maxWidth: 420, padding: '40px 32px', borderRadius: 24,
                                background: 'rgba(147,51,234,0.05)',
                                border: '2px solid rgba(147,51,234,0.3)',
                                position: 'relative', overflow: 'hidden',
                                textAlign: 'center', boxShadow: '0 0 40px rgba(147,51,234,0.1)'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 20, right: -30, background: '#9333ea', color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 30px', transform: 'rotate(45deg)', textTransform: 'uppercase' }}>
                                Acesso Total
                            </div>

                            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Plano VIP Pro</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
                                <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>R$</span>
                                <span style={{ fontSize: 48, fontWeight: 900, color: 'white' }}>34,90</span>
                                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/mês</span>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32 }}>
                                Desbloqueie **TODA a nossa biblioteca** de prompts instantaneamente por 30 dias.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32, textAlign: 'left' }}>
                                {[
                                    "Acesso a 100% dos Prompts",
                                    "Novos Prompts Semanais",
                                    "Variantes Exclusivas",
                                    "Prioridade no Suporte",
                                    "Sem Limite de Cópia",
                                    "Cancele a qualquer momento"
                                ].map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                                        <Check size={16} color="#9333ea" />
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                onClick={() => {
                                    // if (!user) { // user is not defined in this scope, assuming it's from AuthContext
                                    //     navigate('/auth')
                                    //     return
                                    // }
                                    setShowingSubscriptionModal(true)
                                }}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                    border: 'none', color: 'white', fontWeight: 700, fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(147,51,234,0.4)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Assinar Agora
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>



            {/* Modals */}
            <SubModal
                isOpen={showingSubscriptionModal}
                onClose={() => setShowingSubscriptionModal(false)}
            />
            {/* & Cart */}
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
                prompt={viewingPrompt}
                purchaseId={lastPurchaseId}
                onClose={() => { setViewingPrompt(null); setLastPurchaseId(null) }}
            />

            <ImageLightbox
                imageUrl={viewImage}
                onClose={() => setViewImage(null)}
            />
        </div>
    )
}
