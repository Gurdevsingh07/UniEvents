import { useEffect, useRef } from 'react';

/**
 * Custom hook to run a callback at a specified interval.
 * Used for auto-refreshing data in dashboards.
 * 
 * @param {Function} callback The function to execute
 * @param {number} delay Interval in milliseconds (null to stop)
 */
export function useAutoRefresh(callback, delay = 5000) {
    const savedCallback = useRef();

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        if (delay !== null) {
            const id = setInterval(() => {
                if (savedCallback.current) savedCallback.current();
            }, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
