import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '../lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';

const BUCKET = 'dashboard-files';

const ALLOWED_CONTENT_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv',
]);

const DANGEROUS_EXT = new Set(['exe', 'bat', 'cmd', 'sh', 'ps1', 'js', 'vbs', 'scr']);
const MAX_SIZE = 50 * 1024 * 1024;

async function ensureBucket() {
    if (!supabaseAdmin) return;
    const { data, error: getErr } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (getErr) {
        console.warn('[ensureBucket] getBucket error (may be expected if bucket does not exist):', getErr.message);
    }
    if (!data) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE });
        if (createErr) {
            console.error('[ensureBucket] createBucket failed:', createErr.message);
            throw new Error(`버킷 생성 실패: ${createErr.message}`);
        }
        console.log('[ensureBucket] Bucket created successfully:', BUCKET);
    }
}

export async function POST(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        if (file.size > MAX_SIZE) return NextResponse.json({ error: '50MB 이하 파일만 업로드 가능합니다.' }, { status: 400 });

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (DANGEROUS_EXT.has(ext)) return NextResponse.json({ error: '허용되지 않는 파일 형식입니다.' }, { status: 400 });
        if (file.type && !ALLOWED_CONTENT_TYPES.has(file.type)) {
            // Allow unknown types for flexibility, only block if type is known and not in list
        }

        await ensureBucket();

        const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')}`;
        const arrayBuffer = await file.arrayBuffer();
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, arrayBuffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
            });

        if (error) {
            console.error('[Upload] Supabase storage upload failed:', {
                message: error.message,
                name: error.name,
                statusCode: (error as any).statusCode,
                error: JSON.stringify(error),
            });
            throw new Error(`스토리지 업로드 실패: ${error.message}`);
        }

        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[Upload] Error:', errMsg, error);
        return NextResponse.json({ error: errMsg || '파일 업로드 중 알 수 없는 오류가 발생했습니다.' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }

    try {
        const { url } = await request.json();
        if (url?.includes(BUCKET)) {
            // Extract path from URL: .../<bucket>/<path>
            const parts = url.split(`${BUCKET}/`);
            if (parts[1]) {
                await supabaseAdmin.storage.from(BUCKET).remove([decodeURIComponent(parts[1])]);
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
