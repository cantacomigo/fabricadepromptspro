
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Table Schema Check ---');

    // Query columns via RPC or REST if possible
    // Using a trick: query a non-existent column to see if name listing is in error (doesn't always work)
    // Better: use the RPC if it exists or check the rest interface.

    // REST API doesn't allow easy schema introspection without specific config.
    // Let's try to fetch all rows but only return the keys for the first row.

    console.log('\nFetching one row and checking ALL keys...');
    const singleRes = await fetch(`${url}/rest/v1/prompts?select=*&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (singleRes.ok) {
        const data = await singleRes.json();
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]).join(', '));
        } else {
            console.log('Table is empty? Wait, I saw 25 prompts earlier.');
        }
    } else {
        const text = await singleRes.text();
        console.error('Fetch failed:', singleRes.status, text);
        // If it failed even for limit=1, maybe it's a specific row?
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
