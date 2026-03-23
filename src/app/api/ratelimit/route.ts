import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, type RateLimitAction } from '@/lib/ratelimit'

const VALID_ACTIONS: RateLimitAction[] = [
  'createReview', 'createComment', 'createList', 'createReport',
  'requestGame', 'updateProfile', 'followUser', 'createSession', 'createAccount',
]

export async function POST(request: NextRequest) {
  try {
    const { action, identifier } = await request.json()

    if (!action || !identifier || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const result = await checkRateLimit(action, identifier)

    if (!result.success) {
      return NextResponse.json(result, { status: 429 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ success: true, remaining: 99, reset: 0 })
  }
}
