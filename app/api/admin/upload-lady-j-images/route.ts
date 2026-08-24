import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One-time migration endpoint: uploads public/lady-j-invoices/*.webp into
// the Supabase Storage bucket "lady-j-invoices" using the service role key
// that's already set in Vercel's environment (never exposed to the client).
//
// DELETE THIS ROUTE after running it once — it's gated by ADMIN_SECRET
// below only as a speed bump, not real auth.
const ADMIN_SECRET = '5fMVe37FQtjpa8Yj9wAKxO3TL6qtII4-';
const BUCKET = 'lady-j-invoices';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          'Missing NEXT_PUBLIC_SUPABASE_URL or a service role key env var (tried SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE, SERVICE_ROLE_KEY). Check exact var name in Vercel.',
      },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(url, serviceRoleKey);

  const imageDir = path.join(process.cwd(), 'public', 'lady-j-invoices');
  let files: string[] = [];
  try {
    files = fs.readdirSync(imageDir).filter((f) => f.endsWith('.webp'));
  } catch (e: any) {
    return NextResponse.json({ error: `Could not read ${imageDir}: ${e.message}` }, { status: 500 });
  }

  const results: { file: string; ok: boolean; error?: string }[] = [];
  const CONCURRENCY = 20;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const filePath = path.join(imageDir, file);
        const buffer = fs.readFileSync(filePath);
        const { error } = await supabaseAdmin.storage.from(BUCKET).upload(file, buffer, {
          contentType: 'image/webp',
          upsert: true,
        });
        return { file, ok: !error, error: error?.message };
      })
    );
    results.push(...batchResults);
  }

  const okCount = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    total: files.length,
    uploaded: okCount,
    failed: failed.length,
    failedFiles: failed,
  });
}
