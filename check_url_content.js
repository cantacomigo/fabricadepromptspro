
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- image_url Content Check ---');

    const res = await fetch(`${url}/rest/v1/prompts?select=image_url&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });

    if (res.ok) {
        const data = await res.json();
        const url_val = data[0].image_url;
        console.log(`Type: ${typeof url_val}`);
        console.log(`Start: ${url_val.slice(0, 100)}...`);
        console.log(`End: ...${url_val.slice(-100)}`);
        console.log(`Length: ${url_val.length} chars`);
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
