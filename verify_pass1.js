
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const pass1Cols = 'id,title,description,price,category,image_url';

    console.log('--- FINAL Pass 1 Check: No created_at, No order ---');

    let start = Date.now();
    let res = await fetch(`${url}/rest/v1/prompts?select=${pass1Cols}&limit=100`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    let duration = Date.now() - start;

    if (res.ok) {
        let data = await res.json();
        console.log(`SUCCESS: Fetched ${data.length} prompts in ${duration}ms`);
        console.log('Sample IDs:', data.slice(0, 3).map(p => p.id));
    } else {
        console.log(`FAILED: ${res.status}, ${await res.text()}`);
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
