
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const essentialCols = 'id,title,description,price,category,image_url,sales_count,likes_count,rating,created_at';

    console.log('--- Final Verification (Metadata Fetch) ---');

    const start = Date.now();
    const res = await fetch(`${url}/rest/v1/prompts?select=${essentialCols}&order=created_at.desc`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const duration = Date.now() - start;

    if (res.ok) {
        const data = await res.json();
        console.log(`SUCCESS: Fetched ${data.length} prompts in ${duration}ms`);
        console.log('Sample data (first 2):');
        console.log(JSON.stringify(data.slice(0, 2), (k, v) => k === 'description' ? v.slice(0, 50) + '...' : v, 2));
    } else {
        console.error('Fetch failed:', res.status, await res.text());
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
