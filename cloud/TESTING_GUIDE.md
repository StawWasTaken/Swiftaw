# Cloud Authentication Testing Guide

## End-to-End Testing Flow

### Test 1: Complete Signup → Login → Dashboard

**Preconditions:**
- Supabase project is running
- Database schema initialized
- Cloud pages accessible

**Steps:**
1. Navigate to `/cloud/signup`
2. Enter new test email: `testuser-1@example.com`
3. Enter password: `TestPassword123!`
4. Enter display name: `Test User`
5. Click "Sign Up"
6. Verify redirected to dashboard
7. Check localStorage contains:
   - `cloud_session` (with access_token)
   - `cloud_user_email` 
   - `cloud_user_id`
8. Verify user avatar displays in nav with initial "T"
9. Verify profile widget shows "Test User" name
10. Refresh page and confirm still authenticated
11. Check Supabase database:
    - User record in `users` table
    - Profile record in `profiles` table

**Expected Result:** ✅ User created, authenticated, and profile loaded

---

### Test 2: Login with Existing User

**Preconditions:**
- User account already created
- Database has user and profile records

**Steps:**
1. Navigate to `/cloud/login`
2. Enter email: `testuser-1@example.com`
3. Enter password: `TestPassword123!`
4. Click "Sign In"
5. Verify redirected to dashboard
6. Check localStorage updated
7. Verify profile widget shows correct display name
8. Verify profile avatar is correct initial

**Expected Result:** ✅ User logged in, profile loaded from database

---

### Test 3: Login with Incorrect Password

**Steps:**
1. Navigate to `/cloud/login`
2. Enter email: `testuser-1@example.com`
3. Enter password: `WrongPassword`
4. Click "Sign In"
5. Verify error message displays

**Expected Result:** ✅ Error shown, user not authenticated

---

### Test 4: Signup with Invalid Email

**Steps:**
1. Navigate to `/cloud/signup`
2. Enter invalid email: `notanemail`
3. Enter password: `TestPassword123!`
4. Try to submit

**Expected Result:** ✅ Form validation prevents submission

---

### Test 5: Admin User Access

**Steps:**
1. Sign up with email: `staw@swiftaw.io`
2. Verify redirected to dashboard
3. Check user profile widget has "Admin" badge
4. Verify `cloudAuth.isAdmin()` returns true
5. Verify access level is 5 in localStorage

**Expected Result:** ✅ Special user automatically gets admin access

---

### Test 6: Logout Functionality

**Preconditions:**
- User is logged in

**Steps:**
1. Click logout button in profile widget
2. Verify redirected to `/cloud/login`
3. Check localStorage cleared:
   - No `cloud_session`
   - No `cloud_user_email`
   - No `cloud_user_id`
4. Navigate to dashboard
5. Verify redirected to login (not authenticated)

**Expected Result:** ✅ User logged out, session cleared, auth required

---

### Test 7: Data Persistence Across Products

**Preconditions:**
- User authenticated in Cloud
- User has subaccounts in other products (Fortized, etc.)

**Steps:**
1. Login to Cloud with user account
2. Check `linked_products` table shows connected products
3. Click on linked product
4. Verify logged in without additional auth
5. Return to Cloud dashboard
6. Verify still authenticated

**Expected Result:** ✅ Single login provides access to all linked products

---

### Test 8: Profile Update

**Preconditions:**
- User logged in on dashboard

**Steps:**
1. Click edit profile
2. Change display name to "Updated Name"
3. Save changes
4. Verify profile widget updates immediately
5. Refresh page
6. Verify new display name persists
7. Check `profiles` table in Supabase

**Expected Result:** ✅ Profile changes saved and persisted

---

### Test 9: Session Timeout

**Preconditions:**
- User logged in

**Steps:**
1. Wait for session token to expire (or manually expire)
2. Attempt to access protected page
3. Verify redirected to login
4. Verify clear error message

**Expected Result:** ✅ Expired session handled gracefully

---

### Test 10: Concurrent Sessions

**Preconditions:**
- User logged in on one device

**Steps:**
1. Open same Cloud account in another browser/tab
2. Login with different credentials
3. Verify old session becomes invalid
4. Verify only latest session is active

**Expected Result:** ✅ One active session per user (or managed appropriately)

---

## Database Verification Tests

### Verify Users Table
```sql
SELECT * FROM users WHERE email LIKE 'testuser%';
```
Should show:
- ✅ User record exists
- ✅ email is correct
- ✅ access_level is 1 (or 5 for admin)
- ✅ is_active is true
- ✅ created_at has recent timestamp

### Verify Profiles Table
```sql
SELECT * FROM profiles WHERE user_id = '<user-id>';
```
Should show:
- ✅ Profile record exists
- ✅ display_name matches user input
- ✅ username is set
- ✅ created_at has recent timestamp

### Verify RLS Policies
```sql
SELECT * FROM policies WHERE table_name = 'users';
```
Should show:
- ✅ Read policy for own data
- ✅ Update policy for own data
- ✅ Admin can read all

### Verify Session Logs (Optional)
```sql
SELECT * FROM session_logs WHERE user_id = '<user-id>' ORDER BY login_at DESC;
```
Should show:
- ✅ Login attempt recorded
- ✅ Logout time recorded when user logs out

---

## Test Results Summary

| Test | Status | Date | Notes |
|------|--------|------|-------|
| Signup → Login → Dashboard | ⏳ Pending | - | - |
| Login with existing user | ⏳ Pending | - | - |
| Invalid password error | ⏳ Pending | - | - |
| Admin user access | ⏳ Pending | - | - |
| Logout functionality | ⏳ Pending | - | - |
| Profile persistence | ⏳ Pending | - | - |

