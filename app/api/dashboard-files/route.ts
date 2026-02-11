import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '../lib/auth';

const ALLOWED_CONTENT_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv',
]);

export async function POST(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as HandleUploadBody;
    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                const ext = pathname.split('.').pop()?.toLowerCase() || '';
                const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'js', 'vbs', 'scr'];
                if (dangerousExtensions.includes(ext)) {
                    throw new Error('허용되지 않는 파일 형식입니다.');
                }
                return {
                    maximumSizeInBytes: 10 * 1024 * 1024,
                    allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
                };
            },
            onUploadCompleted: async () => {},
        });
        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { url } = await request.json();
        if (url?.startsWith('https://')) {
            await del(url);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
