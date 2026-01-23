// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xxx'
process.env.CLERK_SECRET_KEY = 'sk_test_xxx'
process.env.RESEND_API_KEY = 're_test_xxx'
process.env.CRON_SECRET = 'test_secret'
