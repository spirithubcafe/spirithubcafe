import { useEffect } from 'react';
import { OverlayScrollbars } from 'overlayscrollbars';
import { useApp } from './useApp';

export const useOverlayScrollbars = () => {
  const { language } = useApp();

  useEffect(() => {
    // Set global default options for OverlayScrollbars
    OverlayScrollbars.env().setDefaultOptions({
      paddingAbsolute: false,
      showNativeOverlaidScrollbars: false,
      update: {
        elementEvents: [['img', 'load']],
        debounce: [0, 33],
        attributes: null,
        ignoreMutation: null
      },
      overflow: {
        x: 'scroll',
        y: 'scroll'
      },
      scrollbars: {
        theme: 'os-theme-spirit-hub',
        visibility: 'visible', // Always show scrollbars
        autoHide: 'never', // Never auto-hide
        autoHideDelay: 0,
        autoHideSuspend: false,
        dragScroll: true,
        clickScroll: true,
        pointers: ['mouse', 'touch', 'pen']
      }
    });

    // Initialize OverlayScrollbars on document body
    const osInstance = OverlayScrollbars(document.body, {
      scrollbars: {
        theme: 'os-theme-spirit-hub',
        visibility: 'visible', // Always show scrollbars
        autoHide: 'never' // Never auto-hide
      }
    });

    // Update direction based on language for RTL support
    if (osInstance) {
      const hostElement = osInstance.elements().host;
      if (hostElement) {
        hostElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      }
    }

    // Cleanup function
    return () => {
      if (osInstance) {
        osInstance.destroy();
      }
    };
  }, [language]);

  // Return utility function for manual initialization on specific elements
  const initializeElement = (element: HTMLElement, options = {}) => {
    return OverlayScrollbars(element, {
      scrollbars: {
        theme: 'os-theme-spirit-hub'
      },
      ...options
    });
  };

  return { 
    OverlayScrollbars,
    initializeElement
  };
};