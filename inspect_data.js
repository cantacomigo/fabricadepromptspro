
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
    console.log('Fetching prompts from:', supabaseUrl)
    const { data, error } = await supabase
        .from('prompts')
        .select('id, title, image_url')
        .limit(5)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Prompts found:', data?.length)
    data?.forEach(p => {
        console.log(`- [${p.id}] ${p.title}: "${p.image_url}"`)
    })
}

checkData()
