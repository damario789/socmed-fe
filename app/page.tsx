"use client";

import { useFeed } from "../hooks/useFeed";
import PostCard from "../components/PostCard";
import ClientOnly from "../components/ClientOnly";
import InfiniteScroll from "../components/InfiniteScroll";
import CreatePostButton from "../components/CreatePostButton";
import { useCallback } from "react";

export default function Home() {
  return (
    <ClientOnly
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"
                ></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <FeedContent />
    </ClientOnly>
  );
}

function FeedContent() {
  const {
    posts,
    loading,
    error,
    hasMore,
    loadMorePosts,
    refreshFeed,
  } = useFeed();

  const handleRefresh = useCallback(() => {
    refreshFeed();
  }, [refreshFeed]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-red-100 dark:bg-red-900 p-4 rounded-lg text-red-700 dark:text-red-200">
          <p>Error loading feeds: {error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <button
            onClick={handleRefresh}
            className="text-blue-500 hover:text-blue-700"
            aria-label="Refresh feed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
          </button>
        </div>

        {posts.length === 0 && !loading ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-300">
              No posts to display. Follow some users to see their posts!
            </p>
          </div>
        ) : (
          <InfiniteScroll
            loadMore={loadMorePosts}
            hasMore={hasMore}
            loading={loading}
            endMessage={
              <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                You're all caught up with the latest posts! 📱✨
              </div>
            }
          >
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={handleRefresh}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}

        {posts.length === 0 && loading && (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"
              ></div>
            ))}
          </div>
        )}

        {/* Add the floating create post button */}
        <CreatePostButton />
      </div>
    </div>
  );
}