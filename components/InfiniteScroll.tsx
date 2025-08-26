"use client";

import { ReactNode, useEffect, useRef } from "react";

interface InfiniteScrollProps {
  children: ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  loadingIndicator?: ReactNode;
  endMessage?: ReactNode;
}

export default function InfiniteScroll({
  children,
  loadMore,
  hasMore,
  loading,
  threshold = 0.8,
  loadingIndicator = <DefaultLoadingIndicator />,
  endMessage = <DefaultEndMessage />,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        root: null, // viewport is the root
        rootMargin: "100px",
        threshold,
      }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadMore, loading, threshold]);

  return (
    <div>
      {children}
      <div ref={observerTarget} className="h-4 my-4" />
      {loading && loadingIndicator}
      {!hasMore && !loading && endMessage}
    </div>
  );
}

function DefaultLoadingIndicator() {
  return (
    <div className="flex justify-center my-6">
      <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
    </div>
  );
}

function DefaultEndMessage() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-6">
      You're all caught up! 🎉
    </div>
  );
}
