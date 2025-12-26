import { useEffect, useState } from 'react';

/**
 * Custom hook for debounced search functionality
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns [currentValue, debouncedValue, setValue, isDebouncing]
 */
export function useDebouncedSearch(initialValue = '', delay = 500) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
      setIsDebouncing(false);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue, isDebouncing] as const;
}
