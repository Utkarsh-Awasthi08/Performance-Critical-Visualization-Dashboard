import { useState, useMemo, useEffect, useRef } from 'react';

interface UseVirtualizationProps {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization({ 
  totalItems, 
  itemHeight, 
  containerHeight, 
  overscan = 5 
}: UseVirtualizationProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      setScrollTop((e.target as HTMLElement).scrollTop);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const totalHeight = totalItems * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Expose a method to manually scroll back to top
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  };

  return {
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    scrollTop,
    scrollToTop
  };
}
