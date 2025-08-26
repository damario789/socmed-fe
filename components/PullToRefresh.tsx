"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  pullDownThreshold?: number;
  maxPullDownDistance?: number;
  backgroundColor?: string;
  refreshingContent?: ReactNode;
  pullDownContent?: ReactNode;
}

const PullToRefresh = ({
  children,
  onRefresh,
  pullDownThreshold = 100,
  maxPullDownDistance = 200,
  backgroundColor = "rgb(243 244 246)", // bg-gray-100
  refreshingContent = <DefaultRefreshingContent />,
  pullDownContent = <DefaultPullDownContent />,
}: PullToRefreshProps) => {
  const [isPullDown, setIsPullDown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownDistance, setPullDownDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isRefreshing) {
      handleRefresh();
    }
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent | MouseEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      isDraggingRef.current = true;
      startYRef.current = 'touches' in e 
        ? e.touches[0].clientY 
        : (e as MouseEvent).clientY;
      currentYRef.current = startYRef.current;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    currentYRef.current = 'touches' in e 
      ? e.touches[0].clientY 
      : (e as MouseEvent).clientY;
    
    const distance = Math.max(0, currentYRef.current - startYRef.current);
    
    if (distance > 0) {
      // Prevent default only when pulling down
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }
      
      // Apply resistance to pull - the further you pull, the harder it gets
      const newDistance = Math.min(
        maxPullDownDistance,
        distance * 0.5 // Resistance factor
      );
      
      setPullDownDistance(newDistance);
      setIsPullDown(newDistance >= pullDownThreshold);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;

    if (pullDownDistance >= pullDownThreshold) {
      setIsRefreshing(true);
    } else {
      setPullDownDistance(0);
    }
  };

  const handleRefresh = async () => {
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDownDistance(0);
      setIsPullDown(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart as any}
      onMouseMove={handleTouchMove as any}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Pull down indicator */}
      <div
        className="flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{
          height: `${pullDownDistance}px`,
          backgroundColor: backgroundColor,
          opacity: pullDownDistance / pullDownThreshold
        }}
      >
        {isRefreshing ? refreshingContent : pullDownContent}
      </div>
      
      {/* Main content */}
      {children}
    </div>
  );
};

function DefaultPullDownContent() {
  return (
    <div className="flex items-center space-x-2">
      <svg
        className="animate-bounce w-6 h-6 text-gray-500"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
      <span className="text-gray-500">Pull to refresh</span>
    </div>
  );
}

function DefaultRefreshingContent() {
  return (
    <div className="flex items-center space-x-2">
      <svg
        className="animate-spin h-5 w-5 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="text-gray-500">Refreshing...</span>
    </div>
  );
}

export default PullToRefresh;
