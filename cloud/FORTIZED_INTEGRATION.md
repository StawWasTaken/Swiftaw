# Swiftaw Cloud ↔ Fortized Integration Guide

## Overview

Swiftaw Cloud is the unified identity layer. Fortized is a product that consumes Cloud authentication. When users log into Fortized, they authenticate via Swiftaw Cloud and can manage multiple Fortized subaccounts from their Cloud dashboard.

---

## Architecture Diagram

```
┌─────────────────────┐
│  Fortized Login     │
│  (fortized.com)     │
└──────────┬──────────┘
           │ "Sign in with Swiftaw Cloud"
           ↓
┌─────────────────────┐
│  Swiftaw Cloud      │ ← User creates/logs in
│  (cloud.swiftaw.io) │   Returns Cloud JWT
└──────────┬──────────┘
           │ JWT token
           ↓
┌─────────────────────┐
│  Fortized Callback  │ ← Validate JWT, select subaccount
│  /api/auth/cloud    │   Return Fortized session
└──────────┬──────────┘
           │ Fortized session
           ↓
┌─────────────────────┐
│  Fortized Game      │ ← User plays
│  (fortized.com)     │
└─────────────────────┘
```

---

## 1️⃣ AUTHENTICATION FLOW

### Step 1: User initiates login in Fortized

**URL:** `https://fortized.com/login`

```html
<button onclick="signInWithCloud()">Sign in with Swiftaw Cloud</button>

<script>
  function signInWithCloud() {
    const redirectTo = encodeURIComponent('https://fortized.com/auth/cloud-callback');
    window.location.href = `https://cloud.swiftaw.io/login?redirect_to=${redirectTo}`;
  }
</script>
```

### Step 2: User logs into Cloud

- Enters email + password
- Cloud validates credentials against Supabase
- Cloud generates JWT token
- Redirects back to Fortized with token

**Redirect URL:**
```
https://fortized.com/auth/cloud-callback?cloud_token=eyJhbGci...
```

### Step 3: Fortized validates Cloud JWT & selects subaccount

**Endpoint:** `POST /api/auth/cloud-callback`

**Request:**
```json
{
  "cloud_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cloud_user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**What Fortized does:**
1. Validate the JWT signature using Cloud's public key
2. Extract `cloud_user_id` from token
3. Check if user has existing Fortized accounts linked to this Cloud ID
4. If multiple accounts exist → show account picker
5. If no accounts → prompt "Create new Fortized account" or "Link existing"
6. Return Fortized auth token/session

**Response:**
```json
{
  "fortized_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fortized_user_id": "user_123",
  "subaccount_id": "sub_abc123",
  "username": "@gaming_pro",
  "email": "user@example.com",
  "expires_in": 86400
}
```

### Step 4: User in Fortized

Set Fortized session cookie with the returned token. User is now authenticated.

---

## 2️⃣ CLOUD'S PUBLIC KEY (for JWT validation)

**Endpoint:** `GET https://cloud.swiftaw.io/api/auth/public-key`

**Response:**
```json
{
  "alg": "HS256",
  "kty": "oct",
  "key": "your-hs256-secret-key-for-jwt-validation"
}
```

**Or for asymmetric (RS256):**
```json
{
  "alg": "RS256",
  "kty": "RSA",
  "n": "xGOr-H7A-PWOvH4zxn5u...",
  "e": "AQAB"
}
```

**Usage in Fortized (Node.js example):**
```javascript
const jwt = require('jsonwebtoken');
const publicKey = await fetch('https://cloud.swiftaw.io/api/auth/public-key').then(r => r.json());

app.post('/api/auth/cloud-callback', (req, res) => {
  try {
    const decoded = jwt.verify(req.body.cloud_token, publicKey.key);
    const cloudUserId = decoded.sub; // Cloud user ID
    
    // Continue with account linking/selection
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

---

## 3️⃣ REQUIRED API ENDPOINTS ON FORTIZED

### Endpoint 1: Link to Cloud / Create New Account

**POST** `/api/accounts/link-to-cloud`

**Headers:**
```
Authorization: Bearer {cloud_jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cloud_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "gaming_pro",
  "email": "user@example.com",
  "action": "create"  // or "link"
}
```

**Response:**
```json
{
  "success": true,
  "subaccount_id": "sub_abc123",
  "username": "gaming_pro",
  "email": "user@example.com",
  "created_at": "2026-04-04T12:00:00Z",
  "linked_to_cloud": true
}
```

**Error Responses:**
```json
{
  "error": "username_exists",
  "message": "Username already taken in Fortized"
}
```

---

### Endpoint 2: Get Cloud User's Fortized Accounts

**GET** `/api/accounts/{cloud_user_id}`

**Headers:**
```
Authorization: Bearer {cloud_jwt_token}
```

**Response:**
```json
{
  "success": true,
  "cloud_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "accounts": [
    {
      "subaccount_id": "sub_abc123",
      "username": "gaming_pro",
      "email": "user@example.com",
      "created_at": "2026-01-15T10:00:00Z",
      "last_login": "2026-04-03T20:15:30Z",
      "role": "player"
    },
    {
      "subaccount_id": "sub_def456",
      "username": "mod_admin",
      "email": "user@example.com",
      "created_at": "2026-02-01T08:30:00Z",
      "last_login": "2026-04-02T15:45:00Z",
      "role": "moderator"
    }
  ]
}
```

---

### Endpoint 3: Switch Active Subaccount

**POST** `/api/auth/switch-subaccount`

**Headers:**
```
Authorization: Bearer {cloud_jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cloud_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "subaccount_id": "sub_def456"
}
```

**Response:**
```json
{
  "success": true,
  "fortized_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subaccount_id": "sub_def456",
  "username": "mod_admin",
  "expires_in": 86400
}
```

---

### Endpoint 4: Disconnect / Unlink Account

**DELETE** `/api/accounts/{cloud_user_id}/{subaccount_id}`

**Headers:**
```
Authorization: Bearer {cloud_jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Account disconnected from Cloud"
}
```

---

### Endpoint 5: Verify Cloud Token

**GET** `/api/auth/verify-cloud-token?token={jwt}`

**Response:**
```json
{
  "valid": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1680000000,
  "exp": 1680086400
}
```

**Or if invalid:**
```json
{
  "valid": false,
  "error": "token_expired"
}
```

---

## 4️⃣ DATABASE SCHEMA FOR FORTIZED

### New Table: `cloud_account_links`

```sql
CREATE TABLE cloud_account_links (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  cloud_user_id UUID NOT NULL,
  fortized_user_id BIGINT NOT NULL REFERENCES users(id),
  subaccount_id UUID NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  linked_by VARCHAR(50) DEFAULT 'cloud',  -- 'cloud' or 'manual'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(cloud_user_id, subaccount_id),
  UNIQUE(subaccount_id),
  FOREIGN KEY(fortized_user_id) REFERENCES users(id)
);
```

### Update `users` Table

```sql
ALTER TABLE users ADD COLUMN (
  cloud_user_id UUID,
  is_linked_to_cloud BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  UNIQUE(cloud_user_id)
);
```

---

## 5️⃣ IMPLEMENTATION CHECKLIST

### Backend

- [ ] Add `cloud_user_id`, `is_linked_to_cloud`, `last_login` columns to `users` table
- [ ] Create `cloud_account_links` table
- [ ] Implement JWT validation using Cloud's public key
- [ ] Build `POST /api/accounts/link-to-cloud` endpoint
- [ ] Build `POST /api/accounts/link-existing` endpoint
- [ ] Build `GET /api/accounts/{cloud_user_id}` endpoint
- [ ] Build `POST /api/auth/switch-subaccount` endpoint
- [ ] Build `POST /api/auth/cloud-callback` endpoint
- [ ] Build `DELETE /api/accounts/{cloud_user_id}/{subaccount_id}` endpoint
- [ ] Build `GET /api/auth/verify-cloud-token` endpoint
- [ ] Implement rate limiting (100 req/min per IP, 1000 req/min per user)
- [ ] Add token refresh logic (24h expiry, 30d refresh)

### Frontend

- [ ] Replace traditional signup with Cloud-first flow
- [ ] Add "Sign in with Swiftaw Cloud" button to login page
- [ ] Build subaccount picker after login
- [ ] Implement account switching mid-session
- [ ] Add disconnect account UI

### Testing

- [ ] Test full Cloud → Fortized login flow
- [ ] Test JWT validation with invalid tokens
- [ ] Test account creation via Cloud
- [ ] Test account linking with existing Fortized accounts
- [ ] Test account switching
- [ ] Test duplicate username rejection
- [ ] Test rate limiting

---

## 6️⃣ ERROR HANDLING

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `401_invalid_token` | Cloud token is invalid/expired | User logs in again to Cloud |
| `401_token_expired` | Token expired | Use refresh token to get new access token |
| `403_forbidden` | User doesn't have permission | Check Cloud token validity |
| `409_username_exists` | Username already taken in Fortized | Suggest alternative username |
| `409_duplicate_link` | Account already linked to this Cloud user | Show in dashboard |
| `404_not_found` | Account/Cloud user doesn't exist | Create new account |
| `429_rate_limited` | Too many requests | Implement backoff |

### Example Error Response

```json
{
  "error": {
    "code": "409_username_exists",
    "message": "Username 'gaming_pro' already exists in Fortized",
    "field": "username",
    "suggestion": "gaming_pro_2"
  }
}
```

---

## 7️⃣ TIMELINE & ROLLOUT

### Phase 1: Backend API (Weeks 1-2)
- [ ] Set up database schema
- [ ] Implement all 7 endpoints
- [ ] Test with staging Swiftaw Cloud

### Phase 2: Frontend Integration (Weeks 3-4)
- [ ] Add Cloud login button
- [ ] Build account picker UI
- [ ] Test end-to-end flow

### Phase 3: Gradual User Rollout (Ongoing)
- **Now:** Optional - "Sign in with Swiftaw Cloud" available
- **Month 2:** Show recommendation prompt on login
- **Month 3:** Required for new features

---

## 8️⃣ TESTING WITH SWIFTAW CLOUD (STAGING)

### Staging Credentials
- **Cloud URL:** `https://staging-cloud.swiftaw.io`
- **Test Account:** 
  - Email: `test@swiftaw.io`
  - Password: `TestPassword123`

### Manual Testing Steps

1. Go to `https://fortized.com/login`
2. Click "Sign in with Swiftaw Cloud"
3. You're redirected to Cloud login
4. Log in with test account
5. Cloud redirects to `https://fortized.com/auth/cloud-callback?cloud_token=...`
6. Fortized validates token and shows account picker
7. Select or create Fortized account
8. You're logged into Fortized
9. Go to Cloud dashboard to see linked account

---

## 9️⃣ API RATE LIMITING

**Cloud enforces:**
- 100 requests/minute per IP
- 1000 requests/minute per authenticated user

**Fortized should also enforce:**
- 100 requests/minute per IP
- 1000 requests/minute per authenticated Fortized user

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1680086400
```

---

## 🔟 SUPPORT & QUESTIONS

If you have questions about Cloud integration:

1. Check this document first
2. Review the endpoints and examples
3. Ask Claude (Cloud team) for clarification

**Cloud Team Contact:** We're in the same repo, ask through the user.

---

## Example: Full Login Flow in Code

### Fortized Frontend (JavaScript)

```javascript
// 1. User clicks "Sign in with Swiftaw Cloud"
function loginWithCloud() {
  const redirectUrl = encodeURIComponent(
    `${window.location.origin}/auth/cloud-callback`
  );
  window.location.href = 
    `https://cloud.swiftaw.io/login?redirect_to=${redirectUrl}`;
}

// 2. Cloud redirects back to us with token
const params = new URLSearchParams(window.location.search);
const cloudToken = params.get('cloud_token');

if (cloudToken) {
  // Send to backend for validation
  fetch('/api/auth/cloud-callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cloud_token: cloudToken })
  })
  .then(r => r.json())
  .then(data => {
    if (data.multiple_accounts) {
      // Show account picker
      showAccountPicker(data.accounts);
    } else {
      // Log in with selected account
      loginWithAccount(data.fortized_token, data.subaccount_id);
    }
  });
}
```

### Fortized Backend (Node.js)

```javascript
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

// 1. Validate Cloud JWT
async function validateCloudToken(token) {
  try {
    const publicKey = await fetch(
      'https://cloud.swiftaw.io/api/auth/public-key'
    ).then(r => r.json());
    
    return jwt.verify(token, publicKey.key);
  } catch (err) {
    throw new Error('Invalid Cloud token');
  }
}

// 2. Handle Cloud callback
app.post('/api/auth/cloud-callback', async (req, res) => {
  try {
    const decoded = await validateCloudToken(req.body.cloud_token);
    const cloudUserId = decoded.sub;
    
    // Check if user has accounts linked
    const accounts = await db.query(
      'SELECT * FROM cloud_account_links WHERE cloud_user_id = ?',
      [cloudUserId]
    );
    
    if (accounts.length === 0) {
      // No accounts - prompt to create/link
      return res.json({
        action: 'create_or_link',
        cloud_user_id: cloudUserId,
        email: decoded.email
      });
    }
    
    if (accounts.length === 1) {
      // One account - log them in
      const account = accounts[0];
      const token = generateFortizedToken(account);
      return res.json({
        fortized_token: token,
        subaccount_id: account.subaccount_id,
        username: account.username
      });
    }
    
    // Multiple accounts - show picker
    return res.json({
      multiple_accounts: true,
      accounts: accounts.map(a => ({
        id: a.subaccount_id,
        username: a.username,
        lastLogin: a.last_login
      }))
    });
    
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});
```

---

**Document Version:** 1.0  
**Last Updated:** April 4, 2026  
**Fortized Team:** This is your integration spec. Let us know if anything is unclear!
