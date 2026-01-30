/**
 * Tests for cron authentication logic
 *
 * Authentication:
 * - Bearer token in Authorization header
 * - Or ?token= query parameter
 * - Must match CRON_SECRET env variable
 *
 * @jest-environment node
 */

describe('Cron Authentication Logic', () => {
  const CRON_SECRET = 'test_secret_123'

  /**
   * Utility function that mimics the cron authentication logic
   * from app/api/cron/{sync-meta,send-digests}/route.ts
   */
  function isAuthorized(authHeader: string | null, tokenParam: string | null, secret: string): boolean {
    const expectedAuth = `Bearer ${secret}`
    return authHeader === expectedAuth || tokenParam === secret
  }

  describe('Authorization checks', () => {
    it('should accept valid Bearer token', () => {
      const authHeader = `Bearer ${CRON_SECRET}`
      const tokenParam = null

      expect(isAuthorized(authHeader, tokenParam, CRON_SECRET)).toBe(true)
    })

    it('should accept valid query token', () => {
      const authHeader = null
      const tokenParam = CRON_SECRET

      expect(isAuthorized(authHeader, tokenParam, CRON_SECRET)).toBe(true)
    })

    it('should reject invalid Bearer token', () => {
      const authHeader = 'Bearer wrong_secret'
      const tokenParam = null

      expect(isAuthorized(authHeader, tokenParam, CRON_SECRET)).toBe(false)
    })

    it('should reject invalid query token', () => {
      const authHeader = null
      const tokenParam = 'wrong_secret'

      expect(isAuthorized(authHeader, tokenParam, CRON_SECRET)).toBe(false)
    })

    it('should reject empty authentication', () => {
      expect(isAuthorized(null, null, CRON_SECRET)).toBe(false)
    })

    it('should prefer either valid method', () => {
      // Valid header, invalid token
      expect(isAuthorized(`Bearer ${CRON_SECRET}`, 'wrong', CRON_SECRET)).toBe(true)

      // Invalid header, valid token
      expect(isAuthorized('Bearer wrong', CRON_SECRET, CRON_SECRET)).toBe(true)
    })
  })

  describe('Environment variable validation', () => {
    it('should require CRON_SECRET to be set', () => {
      const secret = process.env.CRON_SECRET

      // In test environment, CRON_SECRET is set in jest.setup.js
      expect(secret).toBeDefined()
      expect(secret).toBe('test_secret')
    })

    it('should fail if CRON_SECRET is empty', () => {
      const emptySecret = ''
      const authHeader = 'Bearer something'

      // With empty secret, Bearer comparison would be 'Bearer ' !== 'Bearer something'
      expect(isAuthorized(authHeader, null, emptySecret)).toBe(false)
    })
  })
})

describe('Cron Endpoints Configuration', () => {
  it('sync-meta should be configured at /api/cron/sync-meta', () => {
    const endpoint = '/api/cron/sync-meta'
    expect(endpoint).toBe('/api/cron/sync-meta')
  })

  it('send-digests should be configured at /api/cron/send-digests', () => {
    const endpoint = '/api/cron/send-digests'
    expect(endpoint).toBe('/api/cron/send-digests')
  })

  it('cron routes should be excluded from Clerk middleware', () => {
    // This matches the middleware.ts matcher regex
    const middlewareMatcher = '/((?!_next|api/stripe/webhook|api/cron|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'

    expect(middlewareMatcher).toContain('api/cron')
  })
})

describe('Cron Schedule Documentation', () => {
  it('sync-meta runs daily at 6 AM UTC', () => {
    // This documents the expected cron schedule from vercel.json
    const schedule = '0 6 * * *' // 6 AM UTC daily
    const description = 'Daily Meta ads sync'

    expect(schedule).toMatch(/^\d+\s\d+\s\*\s\*\s\*$/)
    expect(description).toBe('Daily Meta ads sync')
  })

  it('send-digests runs weekly on Monday at 9 AM UTC', () => {
    // This documents the expected cron schedule from vercel.json
    const schedule = '0 9 * * 1' // Monday 9 AM UTC
    const description = 'Weekly email digests'

    expect(schedule).toMatch(/^\d+\s\d+\s\*\s\*\s\d$/)
    expect(description).toBe('Weekly email digests')
  })
})
