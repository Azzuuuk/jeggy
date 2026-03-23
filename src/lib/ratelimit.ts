import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimiters = {
  createReview: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    prefix: '@jeggy/review',
  }),
  createComment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '10 m'),
    prefix: '@jeggy/comment',
  }),
  createList: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: '@jeggy/list',
  }),
  createReport: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(25, '1 h'),
    prefix: '@jeggy/report',
  }),
  requestGame: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(35, '1 h'),
    prefix: '@jeggy/game-request',
  }),
  updateProfile: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(25, '30 m'),
    prefix: '@jeggy/profile',
  }),
  followUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    prefix: '@jeggy/follow',
  }),
  createSession: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    prefix: '@jeggy/session',
  }),
  createAccount: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '24 h'),
    prefix: '@jeggy/signup',
  }),
} as const

export type RateLimitAction = keyof typeof rateLimiters

const messages: Record<RateLimitAction, string> = {
  createReview: 'You can only post 50 reviews per hour. Please wait before posting more.',
  createComment: 'You\'re commenting too fast. Please wait a moment.',
  createList: 'You can only create 10 lists per hour.',
  createReport: 'You can only submit 25 reports per hour.',
  requestGame: 'You can only request 35 games per hour.',
  updateProfile: 'You\'re updating your profile too frequently. Please wait.',
  followUser: 'You\'re following too many people too quickly. Please slow down.',
  createSession: 'You can only log 50 gaming sessions per hour.',
  createAccount: 'Too many accounts created. Please try again later.',
}

export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<{ success: boolean; remaining: number; reset: number; message?: string }> {
  const result = await rateLimiters[action].limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    message: result.success ? undefined : messages[action],
  }
}
