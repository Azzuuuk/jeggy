import type { RateLimitAction } from './ratelimit'

export async function checkClientRateLimit(
  action: RateLimitAction,
  userId: string,
): Promise<{ success: boolean; remaining: number; message?: string }> {
  try {
    const res = await fetch('/api/ratelimit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, identifier: userId }),
    })
    return await res.json()
  } catch {
    // If rate limit check fails, allow the action (fail open)
    return { success: true, remaining: 99 }
  }
}
