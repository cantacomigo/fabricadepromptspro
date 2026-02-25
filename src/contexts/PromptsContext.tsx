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
            setUserLikes([])
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

            // Fetch total confirmed sales
            const { count, error: countError } = await supabase
                .from('purchases')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed')

            if (!countError && count !== null) {
                setTotalSystemSales(count)
            }

            // Map Supabase fields to our Prompt interface
            const mapped: Prompt[] = (data || []).map(p => ({
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
                ratingCount: 0, // Not explicitly tracked in schema but derived or unused
                createdAt: new Date(p.created_at).getTime()
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
                tags: data.tags
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
                tags: updates.tags
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
        if (!user) throw new Error('É necessário estar logado para curtir.')

        if (processingLikes.has(promptId)) return

        const isLiked = userLikes.includes(promptId)
        const prompt = prompts.find(p => p.id === promptId)
        if (!prompt) return

        setProcessingLikes(prev => new Set(prev).add(promptId))

        try {
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

                // 23505 is the error code for unique_violation in PostgreSQL
                if (insertError && insertError.code !== '23505') throw insertError

                // Even if it was a duplicate, we treat it as "liked" in the UI to sync
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
            addCategory, deleteCategory
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

