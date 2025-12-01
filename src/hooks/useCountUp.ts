import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number; // Animation duration in milliseconds
  startOnMount?: boolean; // Whether to start animation on mount
  decimals?: number; // Number of decimal places for decimal numbers
}

/**
 * Custom hook to animate a number from 0 to target value
 * @param targetValue - The target value to count up to
 * @param options - Configuration options
 * @returns The current animated value
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): number {
  const {
    duration = 2000, // 2 seconds default
    startOnMount = true,
    decimals = 0,
  } = options;

  const [count, setCount] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const targetValueRef = useRef(targetValue);

  useEffect(() => {
    // Update target value ref
    targetValueRef.current = targetValue;
    
    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Reset animation state
    startValueRef.current = count;
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValueRef.current + (targetValueRef.current - startValueRef.current) * easeOut;

      if (decimals > 0) {
        setCount(parseFloat(currentValue.toFixed(decimals)));
      } else {
        setCount(Math.floor(currentValue));
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (decimals > 0) {
          setCount(parseFloat(targetValueRef.current.toFixed(decimals)));
        } else {
          setCount(targetValueRef.current);
        }
        animationFrameRef.current = null;
      }
    };

    if (startOnMount) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [targetValue, duration, decimals, startOnMount]);

  return count;
}

