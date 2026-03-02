
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    if (!urlMatch || !keyMatch) {
        throw new Error('Could not find Supabase URL or Key in .env');
    }

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Database Performance (Full Data) ---');

    // Fetch * with order
    console.log('\nFetching ALL columns with order (created_at)...');
    const fullStart = Date.now();
    const fullRes = await fetch(`${url}/rest/v1/prompts?select=*&order=created_at.desc`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    const fullDuration = Date.now() - fullStart;
    console.log(`Full query took: ${fullDuration}ms`);

    if (fullRes.ok) {
        const data = await fullRes.json();
        console.log('Full query success. Row count:', data.length);

        // Check data sizes
        const totalSize = JSON.stringify(data).length;
        console.log('Total JSON size:', (totalSize / 1024).toFixed(2), 'KB');

        const firstRow = data[0];
        if (firstRow) {
            console.log('\nSample Row Sizes (Characters):');
            Object.keys(firstRow).forEach(k => {
                const val = firstRow[k];
                console.log(`- ${k}: ${typeof val === 'string' ? val.length : (val === null ? 0 : 'non-string')}`);
            });
        }
    } else {
        const text = await fullRes.text();
        console.error('Full query failed:', fullRes.status, text);
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
