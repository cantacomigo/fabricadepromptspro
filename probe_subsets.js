
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const testSets = [
        ['id', 'title', 'price', 'category'],
        ['id', 'title', 'price', 'category', 'image_url'],
        ['id', 'title', 'price', 'category', 'image_url', 'sales_count', 'likes_count', 'rating'],
        ['id', 'title', 'price', 'category', 'image_url', 'sales_count', 'likes_count', 'rating', 'created_at'],
        ['id', 'title', 'price', 'category', 'image_url', 'sales_count', 'likes_count', 'rating', 'created_at', 'description']
    ];

    console.log('--- Probing Stable Column Sets ---');

    for (const set of testSets) {
        const cols = set.join(',');
        process.stdout.write(`Testing set (${set.length} cols): ${cols.slice(0, 30)}... `);
        const start = Date.now();
        const res = await fetch(`${url}/rest/v1/prompts?select=${cols}&order=created_at.desc&limit=25`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const duration = Date.now() - start;

        if (res.ok) {
            console.log(`SUCCESS [${duration}ms]`);
        } else {
            console.log(`FAILED [${duration}ms, Status: ${res.status}]`);
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
