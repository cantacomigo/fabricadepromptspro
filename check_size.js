
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Measuring Data Size ---');

    let totalSize = 0;
    for (let i = 0; i < 25; i++) {
        const res = await fetch(`${url}/rest/v1/prompts?select=*&limit=1&offset=${i}`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        if (res.ok) {
            const data = await res.json();
            const size = JSON.stringify(data[0]).length;
            totalSize += size;
            process.stdout.write('.');
        }
    }
    console.log(`\nTotal JSON size for 25 rows: ${(totalSize / 1024).toFixed(2)} KB`);

} catch (err) {
    console.error('Critical script error:', err.message);
}
