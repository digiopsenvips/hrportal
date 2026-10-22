import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        service: 'enactus-hr-portal',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: isSupabaseConfigured ? 'supabase' : 'local_storage',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message || 'Unknown health check error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
