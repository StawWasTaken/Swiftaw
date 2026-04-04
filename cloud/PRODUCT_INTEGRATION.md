# Swiftaw Cloud Product Integration Guide

## Overview
This guide explains how to integrate Swiftaw products (Fortized, etc.) with the Cloud authentication system for unified identity management.

## Architecture

### Single Sign-On (SSO) Flow
```
User visits Product → Check Cloud Auth → If not authenticated → Redirect to Cloud Login
         ↓
Cloud Login → Create/Load User in Supabase → Create Subaccount for Product
         ↓
Redirect back to Product with Session Token → Product validates token → User logged in
         ↓
User data synced across Cloud and Product
```

## Integration Steps

### 1. Include Cloud Auth System
Add to your product's HTML `<head>`:
```html
<script src="/js/cloud-auth.js"></script>
<script src="/js/cloud-subaccounts.js"></script>
```

### 2. Check Authentication
```javascript
// Check if user is authenticated via Cloud
if (cloudAuth.isAuthenticated()) {
  const user = cloudAuth.getUser();
  console.log('Logged in as:', user.email);
  console.log('Display name:', user.displayName);
} else {
  // Redirect to Cloud login
  window.location.href = '/cloud/login?redirect_to=' + window.location.href;
}
```

### 3. Create Product Subaccount
When user first logs into product:
```javascript
const user = cloudAuth.getUser();
const accessToken = cloudAuth.session.access_token;

// Check if user has a subaccount in this product
const subaccounts = await cloudSubaccounts.getProductSubaccounts(
  user.id,
  'fortized', // product name
  accessToken
);

if (subaccounts.length === 0) {
  // Create first subaccount for this product
  const newAccount = await cloudSubaccounts.createSubaccount(
    user.id,
    'fortized',
    {
      name: `${user.displayName}'s Account`,
      displayName: user.displayName,
      email: user.email,
      role: 'owner',
      data: {
        // Product-specific data
        created_via: 'cloud',
        tier: 'free'
      }
    },
    accessToken
  );
  
  console.log('Subaccount created:', newAccount.subaccount_id);
}
```

### 4. Sync User Data
When user updates profile in product:
```javascript
// Update subaccount with new data
await cloudSubaccounts.updateSubaccount(
  subaccountId,
  {
    display_name: newDisplayName,
    data: { /* updated data */ }
  },
  accessToken
);

// Data automatically synced across Cloud
```

### 5. Handle Logout
```javascript
// When user logs out of product
cloudAuth.logout(); // Clears Cloud session
// User redirected to Cloud login
```

## Example: Fortized Integration

### Fortized Login Page
```html
<!DOCTYPE html>
<html>
<head>
  <script src="/js/cloud-auth.js"></script>
  <script src="/js/cloud-subaccounts.js"></script>
</head>
<body>
  <div id="app">
    <!-- Loading state -->
  </div>

  <script>
    async function initFortized() {
      // Check if already authenticated via Cloud
      if (!cloudAuth.isAuthenticated()) {
        // Redirect to Cloud login
        const currentUrl = window.location.href;
        window.location.href = `/cloud/login?redirect_to=${encodeURIComponent(currentUrl)}`;
        return;
      }

      // User is authenticated, setup Fortized
      const user = cloudAuth.getUser();
      console.log('Welcome to Fortized,', user.displayName);

      // Load or create subaccounts
      await setupFortizedAccounts(user);

      // Show main app
      document.getElementById('app').style.display = 'block';
    }

    async function setupFortizedAccounts(user) {
      const accessToken = cloudAuth.session.access_token;

      // Get existing Fortized accounts
      const subaccounts = await cloudSubaccounts.getProductSubaccounts(
        user.id,
        'fortized',
        accessToken
      );

      if (subaccounts.length === 0) {
        // First time - create main account
        await cloudSubaccounts.createSubaccount(
          user.id,
          'fortized',
          {
            name: 'Main Account',
            displayName: user.displayName,
            email: user.email,
            role: 'owner',
            data: { level: 0 }
          },
          accessToken
        );
      }

      // Render account selector or switch to default account
      renderAccountList(subaccounts);
    }

    function renderAccountList(subaccounts) {
      // UI code to show accounts
      console.log('Available accounts:', subaccounts);
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', initFortized);
  </script>
</body>
</html>
```

### Fortized Dashboard
```javascript
// After user selects/switches account
async function switchAccount(subaccountId) {
  const accessToken = cloudAuth.session.access_token;

  // Get subaccount data
  const account = await cloudSubaccounts.getSubaccountData(
    subaccountId,
    accessToken
  );

  // Update UI with account data
  document.getElementById('account-name').textContent = account.display_name;
  document.getElementById('account-email').textContent = account.email;

  // Load account-specific content
  loadAccountContent(account);

  // Update last accessed time
  // (Fortized would track product_id in linked_products)
}

// Profile sync
function updateFortizedProfile(newDisplayName) {
  const user = cloudAuth.getUser();
  
  // Update Cloud profile
  localStorage.setItem('user_display_name', newDisplayName);
  cloudAuth.user.displayName = newDisplayName;

  // This data is now consistent across all products
}
```

## API Reference

### Cloud Auth (`cloudAuth`)
```javascript
// Check authentication
cloudAuth.isAuthenticated()
cloudAuth.isAdmin()

// Get user data
cloudAuth.getUser() // { id, email, displayName, avatar, accessLevel }
cloudAuth.session.access_token // JWT token for API calls

// Authentication
cloudAuth.signin(email, password)
cloudAuth.signup(email, password, displayName)
cloudAuth.logout()
```

### Subaccount Manager (`cloudSubaccounts`)
```javascript
// Get accounts
cloudSubaccounts.getSubaccounts(userId, accessToken)
cloudSubaccounts.getProductSubaccounts(userId, productName, accessToken)

// Manage accounts
cloudSubaccounts.createSubaccount(userId, productName, data, accessToken)
cloudSubaccounts.updateSubaccount(subaccountId, updates, accessToken)
cloudSubaccounts.deleteSubaccount(subaccountId, accessToken)

// Get linked products
cloudSubaccounts.getLinkedProducts(userId, accessToken)
cloudSubaccounts.linkProduct(userId, productName, metadata, accessToken)

// Utilities
cloudSubaccounts.getSubaccountCount(userId, productName, accessToken)
cloudSubaccounts.getSubaccountData(subaccountId, accessToken)
```

## Data Synchronization

### Profile Data Flow
```
Product UI Update
    ↓
Update localStorage in Cloud Auth
    ↓
Sync to Supabase profiles table
    ↓
Available on all products
```

### Subaccount Data Flow
```
Product creates/updates subaccount
    ↓
Call cloudSubaccounts API
    ↓
Data stored in subaccounts table
    ↓
Other Cloud apps can access via API
```

## Security Considerations

### Token Management
- Access tokens are JWT tokens from Supabase
- Tokens include expiration time
- Expired tokens trigger re-authentication
- Tokens are user-specific and cannot be reused

### Data Access
- Users can only access their own subaccounts
- Admin users can access all data via RLS policies
- Product-specific data stored in `data` jsonb field
- Encryption handled by Supabase SSL

### CORS Configuration
Ensure Supabase CORS allows your product domains:
1. Go to Supabase project settings
2. Add domain to CORS whitelist (if needed)
3. Test with fetch from product

## Example: Multi-Product Setup

### User has accounts in multiple products
```
User: john@example.com

Cloud Profiles:
├── username: john
├── display_name: John Doe

Cloud Linked Products:
├── fortized (2 subaccounts)
├── future-product (1 subaccount)

Fortized Subaccounts:
├── Main Account (level 0)
├── Alt Account (level 1)

Future Product Subaccounts:
├── Account 1 (level 0)
```

### Switching between products
```javascript
// User switches from Fortized to Future Product
// Already authenticated via Cloud, no re-login needed
// Load different subaccounts for new product
// Maintain single Cloud session
```

## Testing Integration

### Manual Test
1. Login to Cloud with test user
2. Navigate to Fortized
3. Should be automatically authenticated
4. Check localStorage has user ID and email
5. Verify subaccount created in database
6. Logout from Fortized
7. Verify Cloud session cleared

### Automated Test
```javascript
describe('Product Integration', () => {
  it('should auto-login when user visits from Cloud', async () => {
    // User visits product with Cloud auth
    // Verify authenticated without manual login
  });

  it('should create subaccount on first visit', async () => {
    // First visit to product
    // Verify subaccount created in database
  });

  it('should sync profile data across products', async () => {
    // Update profile in product
    // Verify updated in Cloud and other products
  });
});
```

## Troubleshooting

### User not authenticated in product
- Check Cloud session exists in localStorage
- Verify token not expired
- Check CORS settings
- Check browser console for errors

### Subaccount not created
- Verify user_id is correct
- Check Supabase has write access
- Check product_name matches exactly
- Look for API errors in network tab

### Data not syncing
- Verify access token is valid
- Check RLS policies allow write
- Verify correct user_id in update
- Check Supabase quota not exceeded

## Next Steps

1. ✅ Set up Cloud authentication system
2. ✅ Implement Supabase schema
3. ⏳ Integrate Fortized with Cloud auth
4. ⏳ Create admin panel for managing subaccounts
5. ⏳ Implement product switching UI
6. ⏳ Build automated testing suite
7. ⏳ Deploy to production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [JWT Token Reference](https://supabase.com/docs/guides/auth/jwts)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Cloud Auth Code: `/js/cloud-auth.js`
- Subaccounts Code: `/js/cloud-subaccounts.js`
