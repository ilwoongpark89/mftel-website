import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = (await request.json()) as HandleUploadBody;
    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                maximumSizeInBytes: 10 * 1024 * 1024,
            }),
            onUploadCompleted: async () => {},
        });
        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
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
