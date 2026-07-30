import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'select:not([disabled])',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useMenuKeyboardNavigation<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;

    const getFocusable = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null);

    const focusByOffset = (offset: number) => {
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = currentIndex >= 0
        ? (currentIndex + offset + focusable.length) % focusable.length
        : 0;
      focusable[nextIndex]?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        focusByOffset(1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        focusByOffset(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        getFocusable()[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        const focusable = getFocusable();
        focusable[focusable.length - 1]?.focus();
      }
    };

    root.addEventListener('keydown', handleKeyDown);

    window.setTimeout(() => {
      if (!root.contains(document.activeElement)) getFocusable()[0]?.focus();
    }, 0);

    return () => root.removeEventListener('keydown', handleKeyDown);
  }, [enabled, ref]);
}
