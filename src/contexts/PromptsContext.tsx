import { useState, useEffect, useCallback, createContext, useContext } from 'react'
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
    const [prompts, setPrompts] = useState<Prompt[]>(() => {
        const cached = localStorage.getItem('cached_prompts')
        return cached ? JSON.parse(cached) : []
    })
    const [categories, setCategories] = useState<string[]>(() => {
        const cached = localStorage.getItem('cached_categories')
        return cached ? JSON.parse(cached) : []
    })
    const [userLikes, setUserLikes] = useState<string[]>([])
    const [totalSystemSales, setTotalSystemSales] = useState(() => {
        return Number(localStorage.getItem('cached_total_sales') || 0)
    })
    const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(prompts.length === 0)

    useEffect(() => {
        Promise.all([fetchPrompts(), fetchCategories(), fetchUserLikes()])
            .finally(async () => {
                // Buffer to ensure state is settled before hiding loading
                await new Promise(r => setTimeout(r, 200))
                setLoading(false)
            })
    }, [])

    // Realtime subscription for likes_count auto-updates
    useEffect(() => {
        const channel = supabase
            .channel('prompts-likes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prompts' }, (payload: any) => {
                const updated = payload.new
                if (updated) {
                    setPrompts(prev => prev.map(p =>
                        p.id === updated.id
                            ? { ...p, likesCount: updated.likes_count || 0, salesCount: updated.sales_count || 0 }
                            : p
                    ))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
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
            const catNames = (data || []).map(c => c.name)
            setCategories(catNames)
            localStorage.setItem('cached_categories', JSON.stringify(catNames))
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
                localStorage.setItem('cached_total_sales', globalSales.toString())
            }

            // Map Supabase fields to our Prompt interface with extreme resilience
            const VIP_PROMPT_ID = '00000000-0000-0000-0000-000000000001'
            const rawData = data || []
            const mapped: Prompt[] = []

            for (const p of rawData) {
                if (p.id === VIP_PROMPT_ID) continue
                try {
                    mapped.push({
                        id: String(p.id || ''),
                        title: String(p.title || 'Sem título'),
                        description: String(p.description || ''),
                        prompt: String(p.prompt_text || ''),
                        price: Number(p.price || 0),
                        category: String(p.category || 'Geral'),
                        imageUrl: String(p.image_url || ''),
                        tags: Array.isArray(p.tags) ? p.tags : [],
                        salesCount: Number(p.sales_count || 0),
                        likesCount: Number(p.likes_count || 0),
                        rating: Number(p.rating || 0),
                        ratingCount: 0,
                        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
                        instructions: String(p.instructions || '')
                    })
                } catch (mapErr) {
                    console.error('Error mapping prompt:', p.id, mapErr)
                }
            }

            setPrompts(mapped)
            localStorage.setItem('cached_prompts', JSON.stringify(mapped))

            // Isolate Preloading to avoid blocking prompt display
            try {
                if (mapped.length > 0) {
                    const topImages = mapped.slice(0, 4).map(p => {
                        const src = p.imageUrl || ''
                        if (!src) return null
                        const isUnsplash = src.includes('images.unsplash.com')
                        return isUnsplash ? `${src.split('?')[0]}?w=500&q=60&auto=format&fit=crop` : src
                    }).filter(Boolean) as string[]

                    topImages.forEach(src => {
                        try {
                            // Use a more resilient check that doesn't crash on special chars
                            const links = document.getElementsByTagName('link')
                            let exists = false
                            for (let i = 0; i < links.length; i++) {
                                if (links[i].href === src && links[i].rel === 'preload') {
                                    exists = true
                                    break
                                }
                            }

                            if (!exists) {
                                const link = document.createElement('link')
                                link.rel = 'preload'
                                link.as = 'image'
                                link.href = src
                                // @ts-ignore
                                link.fetchpriority = 'high'
                                document.head.appendChild(link)
                            }
                        } catch (linkErr) {
                            console.warn('Could not inject preload link:', src, linkErr)
                        }
                    })
                }
            } catch (preloadErr) {
                console.error('Non-critical error in preloading logic:', preloadErr)
            }
        } catch (err) {
            console.error('Error loading prompts from Supabase:', err)
            // Log specific error details if available
            if (err && typeof err === 'object' && 'message' in err) {
                console.error('Supabase Error Message:', err.message)
            }
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

        const delta = isLiked ? -1 : 1

        try {
            // Optimistic UI update
            setPrompts(prev => prev.map(p =>
                p.id === promptId
                    ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) + delta) }
                    : p
            ))

            if (!user) {
                // Anonymous: localStorage
                const newLikes = isLiked
                    ? userLikes.filter(id => id !== promptId)
                    : [...userLikes, promptId]
                setUserLikes(newLikes)
                localStorage.setItem('anon_likes', JSON.stringify(newLikes))
            } else {
                // Logged-in: DB
                if (isLiked) {
                    await supabase.from('likes').delete().eq('user_id', user.id).eq('prompt_id', promptId)
                    setUserLikes(prev => prev.filter(id => id !== promptId))
                } else {
                    const { error: insertError } = await supabase.from('likes').insert([{ user_id: user.id, prompt_id: promptId }])
                    if (insertError && insertError.code !== '23505') throw insertError
                    setUserLikes(prev => prev.includes(promptId) ? prev : [...prev, promptId])
                }
            }

            // Use RPC to update count (works for anon and auth)
            await supabase.rpc('toggle_like_count', { p_prompt_id: promptId, p_delta: delta })
        } catch (err) {
            // Revert optimistic update on error
            setPrompts(prev => prev.map(p =>
                p.id === promptId
                    ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) - delta) }
                    : p
            ))
            console.error('Error toggling like:', err)
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

