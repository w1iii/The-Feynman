import { NextResponse } from 'next/server'

// Payment approval is an admin operation and is handled by /api/admin/payments/[id].
export async function PATCH() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
