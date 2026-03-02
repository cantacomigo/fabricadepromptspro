
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Top Column Sizes Audit ---');

    const res = await fetch(`${url}/rest/v1/prompts?select=*&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });

    if (res.ok) {
        const data = await res.json();
        const row = data[0];
        const report = Object.entries(row)
            .map(([k, v]) => ({ key: k, size: JSON.stringify(v).length }))
            .sort((a, b) => b.size - a.size);

        report.forEach(item => {
            console.log(`${item.key}: ${(item.size / 1024).toFixed(2)} KB`);
        });
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
