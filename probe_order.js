
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const cols = 'id,title,description,price,category,image_url,created_at';

    console.log('--- Probing Order Clause ---');

    console.log('\n1. Fetch WITH order(created_at.desc)...');
    let start = Date.now();
    let res = await fetch(`${url}/rest/v1/prompts?select=${cols}&order=created_at.desc&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

    console.log('\n2. Fetch WITHOUT order...');
    start = Date.now();
    res = await fetch(`${url}/rest/v1/prompts?select=${cols}&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

    console.log('\n3. Fetch WITH order(id.desc) (Testing index difference)...');
    start = Date.now();
    res = await fetch(`${url}/rest/v1/prompts?select=${cols}&order=id.desc&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

} catch (err) {
    console.error('Critical script error:', err.message);
}
