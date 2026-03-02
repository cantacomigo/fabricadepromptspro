
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- image_url Size Audit (25 rows) ---');

    for (let i = 0; i < 25; i++) {
        const res = await fetch(`${url}/rest/v1/prompts?select=id,image_url&limit=1&offset=${i}`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        if (res.ok) {
            const data = await res.json();
            const val = data[0].image_url || '';
            console.log(`Row ${i} (ID: ${data[0].id}): ${(val.length / 1024).toFixed(2)} KB`);
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
