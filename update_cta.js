import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { data, error } = await supabase
    .from('site_content')
    .update({ 
        value: 'Explore Our Projects',
        updated_at: new Date().toISOString()
    })
    .eq('key', 'hero_cta');
  
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Successfully updated hero_cta in Supabase to "Explore Our Projects"');
    const { data: verify } = await supabase.from('site_content').select('value').eq('key', 'hero_cta').single();
    console.log('Verified value is now:', verify?.value);
  }
}

update();
