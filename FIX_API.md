# API Routes QA Report - AppForge

**Date:** 2025-01-26  
**Status:** ✅ All issues fixed

---

## Summary

| Route | Auth | Validation | Error Handling | Status |
|-------|------|------------|----------------|--------|
| `/api/apps` (GET) | ✅ | ✅ | ✅ | OK |
| `/api/apps` (POST) | ✅ | ✅ Fixed | ✅ | OK |
| `/api/apps/[id]` (GET) | ✅ | ✅ | ✅ | OK |
| `/api/apps/[id]` (PATCH) | ✅ | ✅ Fixed | ✅ | OK |
| `/api/apps/[id]` (DELETE) | ✅ | ✅ | ✅ | OK |
| `/api/chat` (POST) | ✅ | ✅ Fixed | ✅ | OK |
| `/api/deploy` (POST) | ✅ | ✅ Fixed | ✅ | OK |
| `/api/stripe/checkout` (POST) | ✅ | ✅ | ✅ | OK |
| `/api/stripe/portal` (POST) | ✅ | ✅ | ✅ | OK |
| `/api/webhooks/clerk` (POST) | N/A | ✅ | ✅ Fixed | OK |
| `/api/webhooks/stripe` (POST) | N/A | ✅ | ✅ Fixed | OK |
| `/api/user` (GET) | ✅ | ✅ | ✅ | OK |
| `/api/user` (PATCH) | ✅ | ✅ Fixed | ✅ | OK |

---

## Issues Found & Fixed

### 1. `/api/apps/route.ts` (POST)

**Issue:** No input validation for `name` and `description`

**Fix:** Added JSON parsing error handling and input validation:
```typescript
// Parse and validate request body
let body: { name?: string; description?: string }
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
}

// Validate inputs
if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
  return NextResponse.json({ error: 'Name must be a string with max 100 characters' }, { status: 400 })
}
if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
  return NextResponse.json({ error: 'Description must be a string with max 500 characters' }, { status: 400 })
}
```

---

### 2. `/api/apps/[id]/route.ts` (PATCH)

**Issue:** No input validation for `name`, `description`, `files`, `status`

**Fix:** Added comprehensive validation:
- JSON body parsing with error handling
- `name`: string, max 100 chars
- `description`: string, max 500 chars
- `files`: must be object
- `status`: must be one of `['DRAFT', 'PREVIEW', 'DEPLOYED']`

---

### 3. `/api/chat/route.ts` (POST)

**Issues:**
1. No validation for `messages` array
2. No ownership check when accessing app by `appId`

**Fixes:**
1. Added validation for messages array:
```typescript
if (!messages || !Array.isArray(messages) || messages.length === 0) {
  return NextResponse.json({ error: 'Messages array is required and cannot be empty' }, { status: 400 })
}
// Validate each message has role and content
```

2. Changed `findUnique` to `findFirst` with user ownership check:
```typescript
const app = await prisma.app.findFirst({
  where: { 
    id: appId,
    userId: user.id,  // ← Security fix: ensure user owns this app
  },
})
```

---

### 4. `/api/deploy/route.ts` (POST)

**Issue:** No validation for `appId` before use

**Fix:** Added validation:
```typescript
if (!appId || typeof appId !== 'string') {
  return NextResponse.json({ error: 'appId is required' }, { status: 400 })
}
```

---

### 5. `/api/webhooks/clerk/route.ts`

**Issues:**
1. `user.updated` could fail if user doesn't exist in DB
2. `user.deleted` would throw error if user doesn't exist

**Fixes:**
1. Changed `update` to `upsert` for `user.updated` event
2. Changed `delete` to `deleteMany` for `user.deleted` (doesn't throw if no records)

---

### 6. `/api/webhooks/stripe/route.ts`

**Issues:**
1. Used `process.env.STRIPE_WEBHOOK_SECRET!` without checking if defined
2. `update` calls could fail if customer doesn't exist in DB

**Fixes:**
1. Added explicit check for webhook secret:
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  console.error('Missing STRIPE_WEBHOOK_SECRET')
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
}
```

2. Changed `update` to `updateMany` for subscription events (doesn't throw if no records)

---

### 7. `/api/user/route.ts` (PATCH)

**Issue:** No validation for API key formats

**Fix:** Added format validation:
```typescript
if (openaiKey !== undefined && openaiKey !== null) {
  if (typeof openaiKey !== 'string') {
    return NextResponse.json({ error: 'openaiKey must be a string' }, { status: 400 })
  }
  if (openaiKey.length > 0 && !openaiKey.startsWith('sk-')) {
    return NextResponse.json({ error: 'Invalid OpenAI API key format' }, { status: 400 })
  }
}

if (anthropicKey !== undefined && anthropicKey !== null) {
  if (typeof anthropicKey !== 'string') {
    return NextResponse.json({ error: 'anthropicKey must be a string' }, { status: 400 })
  }
  if (anthropicKey.length > 0 && !anthropicKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Invalid Anthropic API key format' }, { status: 400 })
  }
}
```

---

## Routes Already Correct

### `/api/apps` (GET)
- ✅ Auth check with Clerk
- ✅ User existence check
- ✅ Proper error handling with try/catch
- ✅ Returns 401, 404, 500 as appropriate

### `/api/apps/[id]` (GET, DELETE)
- ✅ Auth check
- ✅ User ownership verification via `userId: user.id`
- ✅ Proper error handling

### `/api/stripe/checkout` (POST)
- ✅ Auth check
- ✅ Plan validation already present
- ✅ Proper error handling

### `/api/stripe/portal` (POST)
- ✅ Auth check
- ✅ Checks for stripeCustomerId
- ✅ Proper error handling

### `/api/user` (GET)
- ✅ Auth check
- ✅ Properly masks API keys (returns boolean, not actual key)
- ✅ Proper error handling

---

## Recommendations for Future

1. **Use Zod for validation** - Consider implementing schema validation with Zod for cleaner, more maintainable validation code

2. **Rate limiting** - Add rate limiting to sensitive endpoints (`/api/chat`, `/api/deploy`)

3. **API key encryption** - The code comments mention encrypting API keys before storage - this should be implemented for production

4. **Logging** - Consider adding structured logging for better debugging in production

5. **Request ID** - Add request ID to error responses for easier debugging
