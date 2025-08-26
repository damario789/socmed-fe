import { useState, useEffect, useCallback } from 'react';
import { Post, FeedsResponse, PaginationMeta, PaginationParams } from '../types';

export function useFeed(initialParams: PaginationParams = { page: 1, limit: 10 }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [params, setParams] = useState<PaginationParams>(initialParams);

  const fetchFeed = useCallback(async (feedParams: PaginationParams, append: boolean = false) => {
    // Ensure this code only runs in the browser
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Build query params
      const queryParams = new URLSearchParams();
      if (feedParams.page) queryParams.append('page', feedParams.page.toString());
      if (feedParams.limit) queryParams.append('limit', feedParams.limit.toString());
      
      const url = `http://localhost:3000/feeds/?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feeds');
      }

      const responseData: FeedsResponse = await response.json();
      
      // When loading more posts, append them to existing list
      if (append) {
        setPosts(prev => [...prev, ...responseData.data]);
      } else {
        // Initial load or refresh
        setPosts(responseData.data);
      }
      
      setMeta(responseData.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    // Only fetch if this is page 1 (initial load)
    if (params.page === 1) {
      fetchFeed(params, false);
    }
  }, [fetchFeed]);

  // Function to load more posts
  const loadMorePosts = useCallback(() => {
    if (!loading && meta?.hasNextPage) {
      const nextPage = (params.page || 1) + 1;
      const newParams = { ...params, page: nextPage };
      setParams(newParams);
      fetchFeed(newParams, true);
    }
  }, [fetchFeed, loading, meta, params]);

  // Function to refresh feed - reverting to original implementation
  const refreshFeed = useCallback(() => {
    const refreshParams = { ...params, page: 1 };
    setParams(refreshParams);
    fetchFeed(refreshParams, false);
  }, [fetchFeed, params]);

  return { 
    posts, 
    loading, 
    error, 
    meta, 
    loadMorePosts,
    refreshFeed,
    hasMore: !!meta?.hasNextPage
  };
}
