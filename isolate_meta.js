
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const metaCols = ['id', 'title', 'description', 'price', 'category', 'image_url', 'created_at'];

    console.log('--- Isolation Test: Pass 1 Columns ---');

    for (const col of metaCols) {
        process.stdout.write(`Testing column: ${col}... `);
        const start = Date.now();
        const res = await fetch(`${url}/rest/v1/prompts?select=${col}&limit=25`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const duration = Date.now() - start;

        if (res.ok) {
            console.log(`SUCCESS [${duration}ms]`);
        } else {
            console.log(`FAILED [${duration}ms, Status: ${res.status}]`);
            console.log('Error:', await res.text());
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
