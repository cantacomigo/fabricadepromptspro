import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, Purchase, Prompt } from '../lib/data'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    user: User | null
    isAdmin: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string) => Promise<void>
    logout: () => void
    purchasePrompt: (promptId: string, amount: number) => Promise<string>
    purchaseMultiplePrompts: (prompts: { id: string, price: number }[]) => Promise<string[]>
    updateProfile: (name: string) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    confirmPurchase: (purchaseId: string) => Promise<void>
    getPurchases: () => Purchase[]
    getUserPurchasedPrompts: () => Prompt[]
    hasPurchased: (promptId: string) => boolean
    purchases: Purchase[]
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    const fetchProfile = useCallback(async (uid: string, email: string) => {
        try {
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single()

            if (error && error.code === 'PGRST116') {
                console.log('Perfil não encontrado, criando novo perfil...')
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{ id: uid, full_name: email.split('@')[0], email, role: 'user' }])
                    .select()
                    .single()

                if (!createError) profile = newProfile as any
            } else if (error) {
                throw error
            }

            const userData: User = {
                uid,
                email: email || '',
                displayName: profile?.full_name || email?.split('@')[0] || 'User',
                isAdmin: profile?.role === 'admin',
                purchasedPromptIds: []
            }

            setUser(userData)
            setIsAdmin(!!userData.isAdmin)
            fetchPurchases(uid, !!userData.isAdmin)
        } catch (err) {
            console.error('Error fetching profile:', err)
        }
    }, [])

    const fetchPurchases = async (uid: string, isUserAdmin: boolean = isAdmin) => {
        try {
            // Tenta buscar com perfil e e-mail
            let query = supabase.from('purchases').select('*, profiles(full_name, email)')
            if (!isUserAdmin) query = query.eq('user_id', uid)

            let { data, error } = await query.order('created_at', { ascending: false })

            // Se falhar (ex: coluna email não existe), tenta sem e-mail
            if (error) {
                console.warn('Falha no join completo, tentando join simples...')
                let q2 = supabase.from('purchases').select('*, profiles(full_name)')
                if (!isUserAdmin) q2 = q2.eq('user_id', uid)
                const result = await q2.order('created_at', { ascending: false })
                data = result.data as any
                error = result.error
            }

            // Fallback total se profiles der erro (ex: tabela não existe)
            if (error) {
                console.warn('Falha em joins, usando busca simples...')
                let q3 = supabase.from('purchases').select('*')
                if (!isUserAdmin) q3 = q3.eq('user_id', uid)
                const result = await q3.order('created_at', { ascending: false })
                data = result.data as any
                error = result.error
            }

            if (data) {
                const mapped: Purchase[] = data.map((p: any) => ({
                    id: p.id,
                    userId: p.user_id,
                    promptId: p.prompt_id,
                    amount: p.amount,
                    status: p.status as 'pending' | 'confirmed',
                    pixCode: '',
                    createdAt: new Date(p.created_at).getTime(),
                    customerName: p.profiles?.full_name,
                    customerEmail: p.profiles?.email
                }))
                setPurchases(mapped)
            }
        } catch (err) {
            console.error('Error fetching purchases:', err)
        }
    }

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!)
            } else {
                setUser(null)
                setIsAdmin(false)
                setPurchases([])
            }
        })

        return () => subscription.unsubscribe()
    }, [fetchProfile])

    const login = async (email: string, password: string) => {
        console.log('Tentando login para:', email)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            console.error('Erro no login:', error.message)
            throw error
        }
    }

    const register = async (email: string, password: string, name: string) => {
        console.log('Tentando registro para:', email)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        })
        if (error) {
            console.error('Erro no registro:', error.message)
            throw error
        }

        if (data.user) {
            console.log('Usuário criado com sucesso no Auth, tentando perfil...')
            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, full_name: name, email, role: 'user' }])

            if (profileError) {
                console.error('Erro ao criar perfil. Verifique se o SQL foi executado:', profileError.message)
            }
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
    }

    const purchasePrompt = async (promptId: string, amount: number): Promise<string> => {
        if (!user) throw new Error('User not logged in')

        // Pix code generation (mocked)
        const pixCode = `00020126330014BR.GOV.BCB.PIX0111fabricapix52040000530398654${amount.toFixed(2).length.toString().padStart(2, '0')}${amount.toFixed(2)}5802BR5920Fabrica de Prompts6009SAO PAULO62070503***6304ABCD`

        const { data, error } = await supabase
            .from('purchases')
            .insert([{
                user_id: user.uid,
                prompt_id: promptId,
                amount,
                status: 'pending'
            }])
            .select()
            .single()

        if (error) throw error

        await fetchPurchases(user.uid, isAdmin)
        return data.id
    }

    const purchaseMultiplePrompts = async (items: { id: string, price: number }[]): Promise<string[]> => {
        if (!user) throw new Error('User not logged in')
        console.log('Iniciando compra múltipla para:', items.length, 'itens')

        const { data, error } = await supabase
            .from('purchases')
            .insert(items.map(item => ({
                user_id: user.uid,
                prompt_id: item.id,
                amount: item.price,
                status: 'pending'
            })))
            .select()

        if (error) {
            console.error('Erro ao inserir compras no Supabase:', error.message, error.details)
            throw error
        }

        console.log('Compras criadas com sucesso, ids:', data?.map((p: any) => p.id))
        await fetchPurchases(user.uid, isAdmin)
        return data.map((p: any) => p.id)
    }

    const confirmPurchase = async (purchaseId: string) => {
        const { error } = await supabase
            .from('purchases')
            .update({ status: 'confirmed' })
            .eq('id', purchaseId)

        if (error) throw error
        if (user) await fetchPurchases(user.uid, isAdmin)
    }

    const updateProfile = async (name: string) => {
        if (!user) throw new Error('User not logged in')
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: name })
            .eq('id', user.uid)

        if (error) throw error

        // Update local state
        setUser(prev => prev ? { ...prev, displayName: name } : null)
    }

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
    }

    // Refresh purchases when admin status changes or on demand
    useEffect(() => {
        if (user) fetchPurchases(user.uid, isAdmin)
    }, [isAdmin, user?.uid])

    const getPurchases = () => purchases

    const hasPurchased = (promptId: string) => {
        return purchases.some(p => p.promptId === promptId && p.status === 'confirmed')
    }

    const getUserPurchasedPrompts = (): Prompt[] => {
        // This is now handled by the PromptsContext + hasPurchased check in UI
        // But for compatibility with existing code that might call it:
        return []
    }

    return (
        <AuthContext.Provider value={{
            user, isAdmin, login, register, logout,
            purchasePrompt, purchaseMultiplePrompts, confirmPurchase, getPurchases,
            getUserPurchasedPrompts, hasPurchased, purchases,
            updateProfile, updatePassword
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

