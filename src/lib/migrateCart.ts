/**
 * Migration utility to convert old cart storage to region-based cart storage
 * This should be run once when the user first loads the app after the update
 */

export const migrateCartToRegionBased = () => {
  try {
    // Check if old cart exists
    const oldCartKey = 'spirithub_cart';
    const oldCart = localStorage.getItem(oldCartKey);
    
    if (!oldCart) {
      return;
    }
    
    // Check if migration already done
    const migrationKey = 'spirithub_cart_migrated';
    if (localStorage.getItem(migrationKey)) {
      return;
    }
    
    // Get current region from URL or default to 'om'
    const currentPath = window.location.pathname;
    let defaultRegion = 'om';
    
    if (currentPath.startsWith('/sa')) {
      defaultRegion = 'sa';
    } else if (currentPath.startsWith('/om')) {
      defaultRegion = 'om';
    }
    
    // Copy old cart to current region's cart
    const newCartKey = `spirithub_cart_${defaultRegion}`;
    localStorage.setItem(newCartKey, oldCart);
    
    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
    
    // Remove old cart (optional - keep for safety)
    // localStorage.removeItem(oldCartKey);
    
    // Remove old cart (optional - keep for safety)
    // localStorage.removeItem(oldCartKey);
  } catch (error) {
    console.error('❌ Error migrating cart:', error);
  }
};

/**
 * Clear all region-based carts
 * Useful for testing or admin purposes
 */
export const clearAllRegionCarts = () => {
  try {
    const regions = ['om', 'sa'];
    let clearedCount = 0;
    
    regions.forEach(region => {
      const cartKey = `spirithub_cart_${region}`;
      if (localStorage.getItem(cartKey)) {
        localStorage.removeItem(cartKey);
        clearedCount++;
      }
    });
  } catch (error) {
    console.error('❌ Error clearing carts:', error);
  }
};

/**
 * Get cart items for all regions
 * Useful for debugging
 */
export const debugAllRegionCarts = () => {
  try {
    const regions = ['om', 'sa'];
    const allCarts: Record<string, any> = {};
    
    regions.forEach(region => {
      const cartKey = `spirithub_cart_${region}`;
      const cart = localStorage.getItem(cartKey);
      
      if (cart) {
        try {
          allCarts[region] = JSON.parse(cart);
        } catch {
          allCarts[region] = cart;
        }
      } else {
        allCarts[region] = null;
      }
    });
    
    return allCarts;
  } catch (error) {
    console.error('❌ Error debugging carts:', error);
    return {};
  }
};
