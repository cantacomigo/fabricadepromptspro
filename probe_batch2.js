
import fs from 'fs';

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();

    const batch2 = 'id,sales_count,likes_count,rating,tags,prompt_text,instructions';

    console.log('--- Probing Batch 2 Columns ---');
    console.log(`Testing: ${batch2}`);

    const start = Date.now();
    const res = await fetch(`${url}/rest/v1/prompts?select=${batch2}&limit=25`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const duration = Date.now() - start;

    if (res.ok) {
        console.log(`SUCCESS [${duration}ms]`);
    } else {
        console.log(`FAILED [${duration}ms, Status: ${res.status}]`);
        console.log('Error:', await res.text());
    }

} catch (err) {
    console.error('Critical script error:', err.message);
}
