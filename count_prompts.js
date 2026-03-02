
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Counting Prompts ---');

    let res = await fetch(`${url}/rest/v1/prompts?select=id`, {
        method: 'HEAD',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Prefer': 'count=exact'
        }
    });

    console.log('Range header:', res.headers.get('content-range'));

} catch (err) {
    console.error('Critical script error:', err.message);
}
