import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '../../lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '../../lib/supabase';

// Supabase Free Tier limits
const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 1 GB
const DATABASE_LIMIT = 500 * 1024 * 1024;      // 500 MB

export async function GET(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    if (auth.userName !== '박일웅') {
        return NextResponse.json({ error: '관리자만 접근할 수 있습니다' }, { status: 403 });
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({
            error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
            storage: 0,
            database: 0,
            storageLimit: STORAGE_LIMIT,
            databaseLimit: DATABASE_LIMIT,
        }, { status: 503 });
    }

    try {
        // Query storage usage from storage.objects
        const { data: storageData, error: storageError } = await supabaseAdmin
            .rpc('exec_sql', {
                query: "SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size FROM storage.objects"
            });

        let storageBytes = 0;
        if (storageError) {
            // Fallback: try direct query via from()
            // Some Supabase setups may not have the exec_sql function
            // Try listing storage objects instead
            console.warn('Storage RPC failed, trying fallback:', storageError.message);
            try {
                const { data: buckets } = await supabaseAdmin.storage.listBuckets();
                if (buckets) {
                    for (const bucket of buckets) {
                        const { data: files } = await supabaseAdmin.storage.from(bucket.name).list('', { limit: 10000 });
                        if (files) {
                            for (const file of files) {
                                if (file.metadata && typeof file.metadata === 'object' && 'size' in file.metadata) {
                                    storageBytes += Number(file.metadata.size) || 0;
                                }
                            }
                        }
                    }
                }
            } catch (fallbackErr) {
                console.warn('Storage fallback also failed:', fallbackErr);
            }
        } else if (storageData && Array.isArray(storageData) && storageData.length > 0) {
            storageBytes = Number(storageData[0]?.total_size) || 0;
        } else if (storageData && typeof storageData === 'object') {
            storageBytes = Number((storageData as Record<string, unknown>).total_size) || 0;
        }

        // Query database size
        let databaseBytes = 0;
        const { data: dbData, error: dbError } = await supabaseAdmin
            .rpc('exec_sql', {
                query: "SELECT pg_database_size(current_database()) as db_size"
            });

        if (dbError) {
            console.warn('Database size RPC failed:', dbError.message);
            // Database size query requires elevated permissions; leave as 0
        } else if (dbData && Array.isArray(dbData) && dbData.length > 0) {
            databaseBytes = Number(dbData[0]?.db_size) || 0;
        } else if (dbData && typeof dbData === 'object') {
            databaseBytes = Number((dbData as Record<string, unknown>).db_size) || 0;
        }

        return NextResponse.json({
            storage: storageBytes,
            database: databaseBytes,
            storageLimit: STORAGE_LIMIT,
            databaseLimit: DATABASE_LIMIT,
        });
    } catch (error) {
        console.error('Storage usage query error:', error);
        return NextResponse.json({
            error: 'Failed to query storage usage',
            storage: 0,
            database: 0,
            storageLimit: STORAGE_LIMIT,
            databaseLimit: DATABASE_LIMIT,
        }, { status: 500 });
    }
}
