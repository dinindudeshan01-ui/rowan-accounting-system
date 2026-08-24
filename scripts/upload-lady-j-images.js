/**
 * Uploads the Lady J scanned-invoice photos (public/lady-j-invoices/*.webp)
 * to the Supabase Storage bucket "lady-j-invoices".
 *
 * Run locally (never commit real keys):
 *
 *   npm install @supabase/supabase-js
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/upload-lady-j-images.js
 *
 * The service role key is required (not the anon key) because it bypasses
 * Row Level Security / bucket policies for the upload. Get it from
 * Supabase Dashboard -> Project Settings -> API -> service_role.
 * NEVER put this key in NEXT_PUBLIC_ env vars or client code — it stays
 * server-side / local-only, used just for this one-off migration.
 *
 * Safe to re-run: uses upsert, so re-running overwrites rather than
 * duplicating or failing.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'lady-j-invoices';
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'lady-j-invoices');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const files = fs.readdirSync(IMAGE_DIR).filter((f) => f.endsWith('.webp'));
  console.log(`Found ${files.length} images in ${IMAGE_DIR}`);

  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const buffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage.from(BUCKET).upload(file, buffer, {
      contentType: 'image/webp',
      upsert: true,
    });

    if (error) {
      console.error(`FAILED ${file}:`, error.message);
      failed++;
    } else {
      ok++;
      if (ok % 25 === 0) console.log(`Uploaded ${ok}/${files.length}...`);
    }
  }

  console.log(`\nDone. Uploaded: ${ok}, Failed: ${failed}`);
  console.log(`\nPublic URL pattern:`);
  console.log(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/<filename>.webp`);
}

main();
