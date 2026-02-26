import { useState, useEffect, createContext, useContext } from 'react'
import type { Prompt } from '../lib/data'
import { supabase } from '../lib/supabase'

interface PromptsContextType {
    prompts: Prompt[]
    categories: string[]
    loading: boolean
    addPrompt: (prompt: Omit<Prompt, 'id' | 'salesCount' | 'rating' | 'ratingCount' | 'createdAt'>) => Promise<void>
    updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>
    deletePrompt: (id: string) => Promise<void>
    incrementSales: (id: string) => Promise<void>
    totalSystemSales: number
    ratePrompt: (id: string, rating: number) => Promise<void>
    toggleLike: (promptId: string) => Promise<void>
    userLikes: string[]
    addCategory: (name: string) => Promise<void>
    deleteCategory: (name: string) => Promise<void>
    refreshPrompts: () => Promise<void>
}

const PromptsContext = createContext<PromptsContextType | null>(null)

export function PromptsProvider({ children }: { children: React.ReactNode }) {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [userLikes, setUserLikes] = useState<string[]>([])
    const [totalSystemSales, setTotalSystemSales] = useState(0)
    const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([fetchPrompts(), fetchCategories(), fetchUserLikes()])
            .finally(() => setLoading(false))
    }, [])

    async function fetchUserLikes() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            // Load anonymous likes from localStorage
            try {
                const stored = localStorage.getItem('anon_likes')
                setUserLikes(stored ? JSON.parse(stored) : [])
            } catch {
                setUserLikes([])
            }
            return
        }

        try {
            const { data, error } = await supabase
                .from('likes')
                .select('prompt_id')
                .eq('user_id', user.id)

            if (error) throw error
            setUserLikes((data || []).map(l => l.prompt_id))
        } catch (err) {
            console.error('Error loading user likes:', err)
        }
    }

    async function fetchCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .order('name')

            if (error) throw error
            setCategories((data || []).map(c => c.name))
        } catch (err) {
            console.error('Error loading categories:', err)
        }
    }

    async function fetchPrompts() {
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Fetch total confirmed sales using the new secure RPC
            const { data: globalSales, error: countError } = await supabase
                .rpc('get_total_confirmed_sales')

            if (!countError && globalSales !== null) {
                setTotalSystemSales(Number(globalSales))
            }

            // Map Supabase fields to our Prompt interface
            // Filter out VIP subscription prompt from gallery
            const VIP_PROMPT_ID = '00000000-0000-0000-0000-000000000001'
            const mapped: Prompt[] = (data || [])
                .filter(p => p.id !== VIP_PROMPT_ID)
                .map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    prompt: p.prompt_text,
                    price: p.price,
                    category: p.category,
                    imageUrl: p.image_url,
                    tags: p.tags || [],
                    salesCount: p.sales_count,
                    likesCount: p.likes_count || 0,
                    rating: Number(p.rating),
                    ratingCount: 0,
                    createdAt: new Date(p.created_at).getTime(),
                    instructions: p.instructions
                }))

            setPrompts(mapped)
        } catch (err) {
            console.error('Error loading prompts:', err)
        } finally {
            setLoading(false)
        }
    }

    const addPrompt = async (data: Omit<Prompt, 'id' | 'salesCount' | 'rating' | 'ratingCount' | 'createdAt'>) => {
        const { data: inserted, error } = await supabase
            .from('prompts')
            .insert([{
                title: data.title,
                description: data.description,
                prompt_text: data.prompt,
                price: data.price,
                category: data.category,
                image_url: data.imageUrl,
                tags: data.tags,
                instructions: data.instructions
            }])
            .select()

        if (error) throw error
        if (inserted) await fetchPrompts()
    }

    const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
        const { error } = await supabase
            .from('prompts')
            .update({
                title: updates.title,
                description: updates.description,
                prompt_text: updates.prompt,
                price: updates.price,
                category: updates.category,
                image_url: updates.imageUrl,
                tags: updates.tags,
                instructions: updates.instructions
            })
            .eq('id', id)

        if (error) throw error
        await fetchPrompts()
    }

    const deletePrompt = async (id: string) => {
        const { error } = await supabase
            .from('prompts')
            .delete()
            .eq('id', id)

        if (error) throw error
        setPrompts(prompts.filter(p => p.id !== id))
    }

    const incrementSales = async (id: string) => {
        const prompt = prompts.find(p => p.id === id)
        if (!prompt) return

        const { error } = await supabase
            .from('prompts')
            .update({ sales_count: prompt.salesCount + 1 })
            .eq('id', id)

        if (error) throw error
        await fetchPrompts()
    }

    const addCategory = async (name: string) => {
        const { error } = await supabase
            .from('categories')
            .insert([{ name }])

        if (error) throw error
        await fetchCategories()
    }

    const deleteCategory = async (name: string) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('name', name)

        if (error) throw error
        await fetchCategories()
    }

    const ratePrompt = async (id: string, rating: number) => {
        const prompt = prompts.find(p => p.id === id)
        if (!prompt) return

        const newRating = ((prompt.rating * (prompt.salesCount || 1)) + rating) / ((prompt.salesCount || 1) + 1)

        const { error } = await supabase
            .from('prompts')
            .update({ rating: Math.round(newRating * 10) / 10 })
            .eq('id', id)

        if (error) throw error
        await fetchPrompts()
    }

    const toggleLike = async (promptId: string) => {
        const { data: { user } } = await supabase.auth.getUser()

        if (processingLikes.has(promptId)) return

        const isLiked = userLikes.includes(promptId)
        const prompt = prompts.find(p => p.id === promptId)
        if (!prompt) return

        setProcessingLikes(prev => new Set(prev).add(promptId))

        try {
            if (!user) {
                // Anonymous like via localStorage
                if (isLiked) {
                    const newLikes = userLikes.filter(id => id !== promptId)
                    setUserLikes(newLikes)
                    localStorage.setItem('anon_likes', JSON.stringify(newLikes))
                    await supabase
                        .from('prompts')
                        .update({ likes_count: Math.max(0, (prompt.likesCount || 0) - 1) })
                        .eq('id', promptId)
                    setPrompts(prev => prev.map(p =>
                        p.id === promptId
                            ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) - 1) }
                            : p
                    ))
                } else {
                    const newLikes = [...userLikes, promptId]
                    setUserLikes(newLikes)
                    localStorage.setItem('anon_likes', JSON.stringify(newLikes))
                    await supabase
                        .from('prompts')
                        .update({ likes_count: (prompt.likesCount || 0) + 1 })
                        .eq('id', promptId)
                    setPrompts(prev => prev.map(p =>
                        p.id === promptId
                            ? { ...p, likesCount: (p.likesCount || 0) + 1 }
                            : p
                    ))
                }
                return
            }

            // Logged-in user: use DB
            if (isLiked) {
                const { error: deleteError } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('prompt_id', promptId)

                if (deleteError) throw deleteError

                await supabase
                    .from('prompts')
                    .update({ likes_count: Math.max(0, (prompt.likesCount || 0) - 1) })
                    .eq('id', promptId)

                setUserLikes(prev => prev.filter(id => id !== promptId))
                setPrompts(prev => prev.map(p =>
                    p.id === promptId
                        ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) - 1) }
                        : p
                ))
            } else {
                const { error: insertError } = await supabase
                    .from('likes')
                    .insert([{ user_id: user.id, prompt_id: promptId }])

                if (insertError && insertError.code !== '23505') throw insertError

                if (!insertError) {
                    await supabase
                        .from('prompts')
                        .update({ likes_count: (prompt.likesCount || 0) + 1 })
                        .eq('id', promptId)
                }

                setUserLikes(prev => prev.includes(promptId) ? prev : [...prev, promptId])
                setPrompts(prev => prev.map(p =>
                    p.id === promptId && !isLiked
                        ? { ...p, likesCount: (p.likesCount || 0) + (insertError ? 0 : 1) }
                        : p
                ))
            }
        } catch (err) {
            console.error('Error toggling like:', err)
            throw err
        } finally {
            setProcessingLikes(prev => {
                const next = new Set(prev)
                next.delete(promptId)
                return next
            })
        }
    }

    return (
        <PromptsContext.Provider value={{
            prompts, categories, loading,
            addPrompt, updatePrompt, deletePrompt,
            incrementSales, totalSystemSales, ratePrompt, toggleLike,
            userLikes,
            addCategory,
            deleteCategory,
            refreshPrompts: fetchPrompts
        }}>
            {children}
        </PromptsContext.Provider>
    )
}

export function usePrompts() {
    const ctx = useContext(PromptsContext)
    if (!ctx) throw new Error('usePrompts must be used within PromptsProvider')
    return ctx
}

