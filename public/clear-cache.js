// Clear SpiritHub Cache
// Run this in the browser console to clear all cached data

(function() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('spirithub_cache'));
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keys.length} cache entries:`, keys);
  console.log('✅ Please refresh the page to fetch fresh data');
})();
