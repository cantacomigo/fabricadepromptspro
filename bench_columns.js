
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const columns = ['description', 'prompt_text', 'image_url', 'tags', 'instructions'];

    console.log('--- Column-by-Column Benchmarking ---');

    for (const col of columns) {
        process.stdout.write(`Testing column: ${col}... `);
        const start = Date.now();
        const res = await fetch(`${url}/rest/v1/prompts?select=id,${col}&limit=25`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const duration = Date.now() - start;

        if (res.ok) {
            const data = await res.json();
            const totalChars = data.reduce((acc, row) => {
                const val = row[col];
                if (Array.isArray(val)) return acc + JSON.stringify(val).length;
                return acc + (val ? String(val).length : 0);
            }, 0);
            console.log(`SUCCESS [${duration}ms, Total Chars: ${totalChars}]`);
        } else {
            console.log(`FAILED [${duration}ms, Status: ${res.status}]`);
            const err = await res.text();
            console.log(`- Reason: ${err}`);
        }
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
