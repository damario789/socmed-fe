"use client";

import Image from 'next/image';
import { Post } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import CommentItem from './CommentItem';
import EditPostModal from './EditPostModal';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onPostUpdated }: PostCardProps) {
  const { id, user, imageUrl, caption, createdAt, comments, commentCount, likeCount, isLiked } = post;
  const [timeAgo, setTimeAgo] = useState(formatDistanceToNow(new Date(createdAt), { addSuffix: true }));
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Update the timeAgo state every minute
  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(new Date(createdAt), { addSuffix: true }));
    };
    
    // Update once immediately
    updateTimeAgo();
    
    // Set up an interval to update every minute
    const intervalId = setInterval(updateTimeAgo, 60000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [createdAt]);

  // Get current user ID from local storage token
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // JWT tokens are in the format: header.payload.signature
        // We need to decode the payload part (which is base64 encoded)
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        setCurrentUserId(decodedPayload.id || null);
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, []);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    if (!showActions) return;

    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  const handleLike = () => {
    setLiked(!liked);
    setLocalLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting comment:", commentText);
    setCommentText('');
  };

  const handleViewAllComments = () => {
    setShowAllComments(true);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:3000/feeds/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Success - refresh the feed
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  const isOwner = user.id === currentUserId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      {/* Post Header with user info */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-bold text-gray-900 dark:text-white">{user.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
          </div>
        </div>

        {/* Three dots menu for post owner */}
        {isOwner && (
          <div className="relative" ref={actionsRef}>
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowActions(!showActions)}
            >
              <svg 
                className="w-5 h-5 text-gray-500 dark:text-gray-400" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                {/* Changed from vertical to horizontal dots */}
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setShowActions(false);
                    setIsEditModalOpen(true);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Caption
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 008-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Post
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Image - Modified to fill card width with flexible height */}
      <div className="w-full">
        {imageError ? (
          <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Image not available</p>
          </div>
        ) : (
          <div className="w-full">
            <img
              src={imageUrl}
              alt={`Post by ${user.username}`}
              className="w-full h-auto"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
              style={{ 
                display: 'block',
                maxHeight: '80vh' // Limit very tall images
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          className={`flex items-center mr-4 ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={handleLike}
        >
          <svg className="w-5 h-5 mr-1" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
          {localLikeCount > 0 && localLikeCount}
        </button>
        <button className="flex items-center text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          {commentCount > 0 && commentCount}
        </button>
      </div>

      {/* Post Caption */}
      <div className="px-4 pb-2">
        <p className="text-gray-800 dark:text-gray-200">
          <span className="font-bold text-gray-900 dark:text-white">{user.username}</span>{" "}
          <span className="font-normal">{caption}</span>
        </p>
      </div>

      {/* Comments section */}
      <div className="px-4 pb-4">
        {commentCount > comments.length && !showAllComments && (
          <button
            onClick={handleViewAllComments}
            className="text-gray-500 dark:text-gray-400 text-sm mb-2"
          >
            View all {commentCount} comments
          </button>
        )}

        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}

        {/* Add comment form */}
        <form onSubmit={handleSubmitComment} className="mt-3 flex">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-200"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`text-blue-500 font-semibold ${!commentText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Post
          </button>
        </form>
      </div>

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <EditPostModal
          post={post}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={onPostUpdated}
        />
      )}
    </div>
  );
}