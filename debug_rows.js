
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Row-by-Row Debugging ---');

    for (let i = 0; i < 25; i++) {
        process.stdout.write(`Testing row ${i}... `);
        const start = Date.now();
        const res = await fetch(`${url}/rest/v1/prompts?select=*&limit=1&offset=${i}`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const duration = Date.now() - start;

        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
                const size = JSON.stringify(data[0]).length;
                console.log(`SUCCESS [${duration}ms, Size: ${(size / 1024).toFixed(2)} KB, ID: ${data[0].id}]`);
            } else {
                console.log('END (No more rows)');
                break;
            }
        } else {
            console.log(`FAILED [${duration}ms, Status: ${res.status}]`);
            const err = await res.text();
            console.log(`- Reason: ${err}`);
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
