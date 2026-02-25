import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Prompt } from '../lib/data'

interface CartContextType {
    cartItems: Prompt[]
    addToCart: (prompt: Prompt) => void
    removeFromCart: (promptId: string) => void
    clearCart: () => void
    cartTotal: number
    itemCount: number
    isInCart: (promptId: string) => boolean
    isCartOpen: boolean
    setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<Prompt[]>([])
    const [isCartOpen, setCartOpen] = useState(false)

    // Load from localStorage on init
    useEffect(() => {
        const saved = localStorage.getItem('fabrica_cart')
        if (saved) {
            try {
                setCartItems(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse cart from localStorage', e)
            }
        }
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('fabrica_cart', JSON.stringify(cartItems))
    }, [cartItems])

    const addToCart = (prompt: Prompt) => {
        setCartItems(prev => {
            if (prev.find(item => item.id === prompt.id)) return prev
            return [...prev, prompt]
        })
    }

    const removeFromCart = (promptId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== promptId))
    }

    const clearCart = () => {
        setCartItems([])
    }

    const isInCart = (promptId: string) => {
        return cartItems.some(item => item.id === promptId)
    }

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price, 0)
    const itemCount = cartItems.length

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, clearCart,
            cartTotal, itemCount, isInCart,
            isCartOpen, setCartOpen
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within CartProvider')
    return context
}
