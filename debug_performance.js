
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

    console.log('--- Database Diagnostics ---');
    console.log('Testing connection to:', url);

    // 1. Try to get just the count (less data, faster)
    console.log('\nChecking prompt count...');
    const countRes = await fetch(`${url}/rest/v1/prompts?select=id`, {
        method: 'HEAD',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Prefer': 'count=exact'
        }
    });

    if (countRes.ok) {
        console.log('Total prompts in DB:', countRes.headers.get('content-range')?.split('/')?.[1] || 'Unknown');
    } else {
        console.error('Count check failed:', countRes.status, await countRes.text());
    }

    // 2. Try to fetch just ONE prompt with no ordering (fastest possible SELECT)
    console.log('\nFetching single prompt (no order)...');
    const singleRes = await fetch(`${url}/rest/v1/prompts?select=id,title&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (singleRes.ok) {
        const data = await singleRes.json();
        console.log('Single prompt success:', data);
    } else {
        console.error('Single fetch failed:', singleRes.status, await singleRes.text());
    }

    // 3. Try to fetch with ordering (what the app does)
    console.log('\nFetching with order (created_at)...');
    const orderStart = Date.now();
    const orderRes = await fetch(`${url}/rest/v1/prompts?select=id&order=created_at.desc&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    console.log(`Order query took: ${Date.now() - orderStart}ms`);

    if (orderRes.ok) {
        console.log('Order query success');
    } else {
        console.error('Order query failed:', orderRes.status, await orderRes.text());
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
