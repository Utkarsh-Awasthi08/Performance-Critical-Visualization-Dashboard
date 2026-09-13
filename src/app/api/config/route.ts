import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    defaultLoad: 10000,
    supportedModes: ['grid', 'focused'],
    maxStressLimit: 100000
  });
}
