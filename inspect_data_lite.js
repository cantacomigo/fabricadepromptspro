
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

    console.log('Fetching from:', url);

    const res = await fetch(`${url}/rest/v1/prompts?select=id,title,image_url&limit=8`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('Fetch failed:', res.status, text);
    } else {
        const data = await res.json();
        console.log('Data fetched successfully:');
        console.log(JSON.stringify(data, null, 2));
    }
} catch (err) {
    console.error('Error in script:', err.message);
}
