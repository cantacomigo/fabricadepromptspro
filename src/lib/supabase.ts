import { createClient } from '@supabase/supabase-js'

// Estas chaves devem vir do seu painel do Supabase
// Vá em Project Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string) => {
    try {
        return url && (url.startsWith('http://') || url.startsWith('https://'))
    } catch {
        return false
    }
}

const safeCreateClient = () => {
    if (!isValidUrl(supabaseUrl)) {
        console.warn('Supabase URL inválida ou não configurada. Verifique seu arquivo .env')
        // Retorna um objeto que imita o cliente mas não quebra o app
        return createClient('https://placeholder.supabase.co', 'placeholder')
    }

    try {
        return createClient(supabaseUrl, supabaseAnonKey)
    } catch (err) {
        console.error('Falha ao inicializar Supabase Client:', err)
        return createClient('https://placeholder.supabase.co', 'placeholder')
    }
}

export const supabase = safeCreateClient()
