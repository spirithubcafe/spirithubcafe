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
      console.log('ℹ️ No old cart found, no migration needed');
      return;
    }
    
    // Check if migration already done
    const migrationKey = 'spirithub_cart_migrated';
    if (localStorage.getItem(migrationKey)) {
      console.log('ℹ️ Cart already migrated');
      return;
    }
    
    console.log('🔄 Migrating old cart to region-based storage...');
    
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
    
    console.log(`✅ Cart migrated to region: ${defaultRegion}`);
    console.log('ℹ️ Old cart key preserved for safety');
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
    
    console.log(`🗑️ Cleared ${clearedCount} region carts`);
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
    
    console.log('🛒 All Region Carts:', allCarts);
    return allCarts;
  } catch (error) {
    console.error('❌ Error debugging carts:', error);
    return {};
  }
};
