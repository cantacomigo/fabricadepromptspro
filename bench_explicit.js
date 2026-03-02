
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    console.log('--- Benchmarking explicit columns ---');

    console.log('\n1. select=ALL EXCEPT tags...');
    const colsNoTags = 'id,title,description,prompt_text,price,category,image_url,sales_count,likes_count,rating,created_at,instructions';
    let start = Date.now();
    let res = await fetch(`${url}/rest/v1/prompts?select=${colsNoTags}&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

    console.log('\n2. select=* (The one that fails)...');
    start = Date.now();
    res = await fetch(`${url}/rest/v1/prompts?select=*&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Duration: ${Date.now() - start}ms, Status: ${res.status}`);

} catch (err) {
    console.error('Critical script error:', err.message);
}
