# Swiftaw Cloud Platform - Setup Guide

## Overview
Swiftaw Cloud is a unified identity and authentication platform for all Swiftaw products. It provides centralized user management with persistent data storage via Supabase.

## Features
- ✅ Unified authentication across all Swiftaw products
- ✅ Persistent user data storage in Supabase
- ✅ User profiles with display names and avatars
- ✅ Subaccount management for product-specific accounts
- ✅ Admin access level for special users (e.g., "staw@swiftaw.io")
- ✅ Session management with JWT tokens
- ✅ Row Level Security (RLS) for data protection

## Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (using project ID: `eujglvqqhrkyhyuqagse`)
3. Note your `SUPABASE_URL` and `SUPABASE_KEY`

### 2. Initialize Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Create a new SQL query
3. Copy the entire contents of `SUPABASE_SCHEMA.sql`
4. Execute the SQL to create all tables and policies

### 3. Configure RLS (Row Level Security)
The schema includes RLS policies that:
- Allow users to read/update only their own data
- Allow admins (access_level = 5) to read all data
- Protect sensitive user information

## API Configuration

### Supabase Credentials
The system uses these credentials (found in `/js/cloud-auth.js`):
- **SUPABASE_URL**: `https://eujglvqqhrkyhyuqagse.supabase.co`
- **SUPABASE_KEY**: Public anon key for client-side auth

⚠️ **Security Note**: The public key is intentionally exposed in client code. Supabase uses RLS policies to protect sensitive data.

## User Authentication Flow

### Signup
1. User enters email and password on `/cloud/signup`
2. Supabase auth creates new user
3. Cloud system creates user record in `users` table
4. Cloud system creates profile record in `profiles` table
5. Session stored in localStorage with user ID and email

### Login
1. User enters email and password on `/cloud/login`
2. Supabase auth validates credentials
3. User profile loaded from `profiles` table
4. Session stored in localStorage
5. User redirected to `/cloud/dashboard`

### Special Admin Case
Any user with email containing "staw" or email exactly "staw@swiftaw.io" automatically receives:
- `access_level = 5` (Admin)
- Access to all user management features
- Visibility of all user data via RLS policies

## Database Tables

### users
Stores core user authentication data
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  access_level integer (1-5),
  created_at timestamp,
  updated_at timestamp,
  last_login timestamp,
  is_active boolean
)
```

### profiles
Stores user profile information
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  bio text,
  phone text,
  created_at timestamp,
  updated_at timestamp
)
```

### subaccounts
Stores product-specific subaccounts linked to Cloud account
```sql
CREATE TABLE subaccounts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  product_name text (fortized, cloud, etc),
  subaccount_id text UNIQUE,
  subaccount_name text,
  display_name text,
  email text,
  role text (owner, admin, member),
  created_at timestamp,
  updated_at timestamp,
  data jsonb (product-specific data)
)
```

### linked_products
Tracks which products are connected to Cloud account
```sql
CREATE TABLE linked_products (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  product_name text,
  connected_at timestamp,
  last_accessed timestamp,
  is_primary boolean,
  metadata jsonb
)
```

### session_logs
Security audit trail of user sessions
```sql
CREATE TABLE session_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  ip_address text,
  user_agent text,
  login_at timestamp,
  logout_at timestamp,
  is_active boolean
)
```

## Frontend Integration

### Cloud Auth System (`/js/cloud-auth.js`)
Global object: `cloudAuth`

```javascript
// Check if user is authenticated
if (cloudAuth.isAuthenticated()) {
  const user = cloudAuth.getUser();
  console.log(user.email, user.displayName);
}

// Check if user is admin
if (cloudAuth.isAdmin()) {
  // Show admin controls
}

// Sign in
await cloudAuth.signin('user@example.com', 'password');

// Sign up
await cloudAuth.signup('newuser@example.com', 'password', 'Display Name');

// Sign out
cloudAuth.logout();
```

### Profile Widget
Automatically injected to `.nav-auth-area` when authenticated:
- Shows user avatar with initial
- Displays display name and email
- Shows "Admin" badge for admin users
- Includes logout button

### Login Prompt
Shows when user is not authenticated:
- Links to signup and login pages
- Motivational messaging about Cloud benefits

## Pages

### `/cloud/signup`
User registration with:
- Email and password fields (yellow background)
- Password strength validation
- Display name input
- Real-time error messages

### `/cloud/login`
User authentication with:
- Email and password fields (yellow background)
- Remember me checkbox
- Forgot password link
- "Create one" signup link

### `/cloud/dashboard`
User dashboard with:
- Account overview
- Profile management
- Connected products list
- Security settings
- Session management

## Testing

### Test Users
- **Regular User**: `testuser@example.com` / `password123`
- **Admin User**: `staw@swiftaw.io` / `admin123`

### Manual Testing Checklist
- [ ] Sign up with new email
- [ ] Login with correct/incorrect credentials
- [ ] Verify user data persists across page reloads
- [ ] Check profile widget displays correctly
- [ ] Verify admin gets special access level
- [ ] Test logout functionality
- [ ] Check localStorage has correct data

### Automated Testing
(To be implemented) - end-to-end tests for:
- Complete signup → login → dashboard flow
- Data persistence via Supabase
- RLS policy enforcement
- Admin access validation

## Security Considerations

1. **Password Storage**: Supabase handles password hashing securely
2. **JWT Tokens**: Access tokens stored in localStorage (not secure for sensitive apps)
3. **RLS Policies**: Database-level security prevents unauthorized access
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Store credentials in environment, not source code (when ready)

## Troubleshooting

### User data not persisting
- Check Supabase project is running
- Verify RLS policies are enabled
- Check browser console for API errors
- Verify user record created in `users` table

### Authentication failing
- Verify email/password are correct
- Check Supabase auth is enabled
- Verify API key has correct permissions
- Check CORS settings in Supabase

### Profile not loading
- Check `profiles` table has records
- Verify user_id matches in both tables
- Check RLS policies allow read access

## Next Steps

1. ✅ Set up Supabase project and schema
2. ✅ Implement user authentication (signup/login)
3. ✅ Create user profiles
4. ⏳ Implement subaccount management
5. ⏳ Connect Fortized and other products
6. ⏳ Build admin dashboard
7. ⏳ Implement automated testing

## Support

For issues or questions:
1. Check Supabase logs for API errors
2. Review browser console for JavaScript errors
3. Verify RLS policies in SQL Editor
4. Check user data in Supabase dashboard
