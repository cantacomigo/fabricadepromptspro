
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const cols = 'id,title,description,price,category,image_url,created_at';

    console.log('--- TESTING: Fetching metadata WITHOUT ordering ---');

    let start = Date.now();
    let res = await fetch(`${url}/rest/v1/prompts?select=${cols}&limit=100`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    let duration = Date.now() - start;

    if (res.ok) {
        let data = await res.json();
        console.log(`SUCCESS: Fetched ${data.length} prompts in ${duration}ms`);
    } else {
        console.log(`FAILED: ${res.status}, ${await res.text()}`);
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
