
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Testing order vs no-order ---');

    console.log('\n1. select=* WITHOUT order...');
    let start = Date.now();
    let res = await fetch(`${url}/rest/v1/prompts?select=*&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

    console.log('\n2. select=* WITH order...');
    start = Date.now();
    res = await fetch(`${url}/rest/v1/prompts?select=*&order=created_at.desc&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

} catch (err) {
    console.error('Critical script error:', err.message);
}
