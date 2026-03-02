
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Column Size Audit ---');

    const res = await fetch(`${url}/rest/v1/prompts?select=*&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });

    if (res.ok) {
        const data = await res.json();
        const row = data[0];
        console.log(`Auditing row ID: ${row.id}`);
        for (const [key, value] of Object.entries(row)) {
            const size = JSON.stringify(value).length;
            console.log(`- ${key}: ${(size / 1024).toFixed(2)} KB`);
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
