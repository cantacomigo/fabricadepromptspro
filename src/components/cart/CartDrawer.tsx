import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Trash2, ArrowRight, Lock } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

interface CartDrawerProps {
    onCheckout: () => void
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
    const { cartItems, removeFromCart, cartTotal, isCartOpen, setCartOpen, clearCart } = useCart()
    const { user } = useAuth()

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCartOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)', zIndex: 1000
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: '100%', maxWidth: 400, background: '#050508',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', flexDirection: 'column', zIndex: 1001,
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(147,51,234,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingCart size={20} color="#9333ea" />
                                </div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white' }}>Seu Carrinho</h2>
                            </div>
                            <motion.button
                                onClick={() => setCartOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                whileHover={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Items List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {cartItems.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: 60 }}>
                                    <div style={{ fontSize: 48, marginBottom: 20 }}>🛒</div>
                                    <h3 style={{ color: 'white', marginBottom: 8 }}>Seu carrinho está vazio</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Explore nossa galeria e encontre prompts incríveis!</p>
                                    <motion.button
                                        onClick={() => setCartOpen(false)}
                                        style={{ marginTop: 24, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                        whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                                    >
                                        Voltar à galeria
                                    </motion.button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 16 }}>
                                    {cartItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', gap: 16, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <img src={item.imageUrl} alt={item.title} style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'white' }}>{item.title}</h4>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: '#9333ea' }}>
                                                    R$ {item.price.toFixed(2).replace('.', ',')}
                                                </div>
                                            </div>
                                            <motion.button
                                                onClick={() => removeFromCart(item.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', alignSelf: 'center' }}
                                                whileHover={{ color: '#ef4444' }}
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={clearCart}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'right', marginTop: 8 }}
                                    >
                                        Limpar carrinho
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer / Summary */}
                        {cartItems.length > 0 && (
                            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Total</span>
                                    <span style={{ color: 'white', fontSize: 24, fontWeight: 900 }}>
                                        R$ {cartTotal.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>

                                {!user && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                                        <Lock size={14} />
                                        Você precisa estar logado para finalizar a compra.
                                    </div>
                                )}

                                <motion.button
                                    onClick={onCheckout}
                                    disabled={!user}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', fontSize: 16, fontWeight: 700,
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        opacity: user ? 1 : 0.5
                                    }}
                                    whileHover={user ? { scale: 1.02, boxShadow: '0 0 20px rgba(147,51,234,0.4)' } : {}}
                                    whileTap={user ? { scale: 0.98 } : {}}
                                >
                                    Finalizar Compra <ArrowRight size={18} />
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
