/**
 * Swiftaw Cloud Subaccount Management
 * Manages product-specific subaccounts linked to Cloud accounts
 * Provides unified identity across all Swiftaw products
 */

class CloudSubaccountManager {
  constructor() {
    this.SUPABASE_URL = 'https://eujglvqqhrkyhyuqagse.supabase.co';
    this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1amdsdnFxaHJreWh5dXFhZ3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ4NjUsImV4cCI6MjA5MDgwMDg2NX0.HjsPbBICvRnM1OTqafdP90grjw9lj1RfR_G_YHicMGY';
  }

  /**
   * Get all subaccounts for a user
   */
  async getSubaccounts(userId, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch subaccounts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subaccounts:', error);
      return [];
    }
  }

  /**
   * Get subaccounts for a specific product
   */
  async getProductSubaccounts(userId, productName, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?user_id=eq.${userId}&product_name=eq.${productName}&select=*`,
        {
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch product subaccounts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product subaccounts:', error);
      return [];
    }
  }

  /**
   * Create a new subaccount for a product
   */
  async createSubaccount(userId, productName, subaccountData, accessToken) {
    try {
      const subaccountId = this.generateSubaccountId(productName, userId);

      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: userId,
            product_name: productName,
            subaccount_id: subaccountId,
            subaccount_name: subaccountData.name || '',
            display_name: subaccountData.displayName || '',
            email: subaccountData.email || '',
            role: subaccountData.role || 'member',
            data: subaccountData.data || {}
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subaccount');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subaccount:', error);
      throw error;
    }
  }

  /**
   * Update a subaccount
   */
  async updateSubaccount(subaccountId, updates, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?id=eq.${subaccountId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) throw new Error('Failed to update subaccount');
      return await response.json();
    } catch (error) {
      console.error('Error updating subaccount:', error);
      throw error;
    }
  }

  /**
   * Delete a subaccount
   */
  async deleteSubaccount(subaccountId, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?id=eq.${subaccountId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete subaccount');
      return true;
    } catch (error) {
      console.error('Error deleting subaccount:', error);
      throw error;
    }
  }

  /**
   * Get all products linked to user account
   */
  async getLinkedProducts(userId, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/linked_products?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch linked products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching linked products:', error);
      return [];
    }
  }

  /**
   * Link a product to user account
   */
  async linkProduct(userId, productName, metadata = {}, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/linked_products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: userId,
            product_name: productName,
            is_primary: false,
            metadata: metadata
          })
        }
      );

      if (!response.ok) throw new Error('Failed to link product');
      return await response.json();
    } catch (error) {
      console.error('Error linking product:', error);
      throw error;
    }
  }

  /**
   * Update last accessed time for a product
   */
  async updateProductAccessTime(linkedProductId, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/linked_products?id=eq.${linkedProductId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            last_accessed: new Date().toISOString()
          })
        }
      );

      if (!response.ok) throw new Error('Failed to update access time');
      return true;
    } catch (error) {
      console.error('Error updating access time:', error);
      return false;
    }
  }

  /**
   * Generate unique subaccount ID
   */
  generateSubaccountId(productName, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${productName}-${userId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Get subaccount count for display
   */
  async getSubaccountCount(userId, productName, accessToken) {
    try {
      const subaccounts = await this.getProductSubaccounts(userId, productName, accessToken);
      return subaccounts.length;
    } catch (error) {
      console.error('Error getting subaccount count:', error);
      return 0;
    }
  }

  /**
   * Get subaccount data for a product
   */
  async getSubaccountData(subaccountId, accessToken) {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?id=eq.${subaccountId}&select=*`,
        {
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch subaccount');
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error('Error fetching subaccount data:', error);
      return null;
    }
  }

  /**
   * List all users who have access to a subaccount (for sharing)
   */
  async getSubaccountAccess(subaccountId, accessToken) {
    try {
      // Query the subaccount and related user records
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/subaccounts?id=eq.${subaccountId}&select=*`,
        {
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch subaccount access');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subaccount access:', error);
      return [];
    }
  }
}

// Global instance
const cloudSubaccounts = new CloudSubaccountManager();

/**
 * Integration example for Fortized:
 *
 * // In Fortized page after Cloud auth
 * const user = cloudAuth.getUser();
 *
 * // Get all Fortized subaccounts for user
 * const subaccounts = await cloudSubaccounts.getProductSubaccounts(
 *   user.id,
 *   'fortized',
 *   cloudAuth.session.access_token
 * );
 *
 * // Create new Fortized subaccount
 * const newAccount = await cloudSubaccounts.createSubaccount(
 *   user.id,
 *   'fortized',
 *   {
 *     name: 'My Fortized Account',
 *     displayName: 'Gaming Account',
 *     email: user.email,
 *     role: 'owner',
 *     data: { /* Fortized-specific data */ }
 *   },
 *   cloudAuth.session.access_token
 * );
 */
