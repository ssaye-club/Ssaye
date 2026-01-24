/**
 * Utility functions to lock/unlock body scroll
 * Prevents background scrolling when modals, menus, or popups are open
 * Also prevents layout shift by compensating for scrollbar width
 */

let lockCount = 0;

/**
 * Lock body scroll
 * Call this when opening a modal, menu, or popup
 */
export const lockScroll = () => {
  lockCount++;
  
  if (lockCount === 1) {
    // Get scrollbar width before locking
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Store current scroll position
    const scrollY = window.scrollY;
    
    // Apply styles to lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Prevent layout shift by adding padding for scrollbar
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
};

/**
 * Unlock body scroll
 * Call this when closing a modal, menu, or popup
 */
export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  
  if (lockCount === 0) {
    // Get stored scroll position
    const scrollY = document.body.style.top;
    
    // Remove lock styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';
    
    // Restore scroll position
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }
};

/**
 * Force unlock (use with caution)
 * Useful for cleanup when component unmounts
 */
export const forceUnlockScroll = () => {
  lockCount = 0;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
};
