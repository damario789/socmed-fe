import { formatDistanceToNow } from 'date-fns';
import { Comment } from '../types';
import { useState, useEffect } from 'react';

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const { user, content, createdAt, likeCount, replyCount } = comment;
  const [timeAgo, setTimeAgo] = useState(formatDistanceToNow(new Date(createdAt), { addSuffix: true }));

  // Update the timeAgo state every minute
  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(new Date(createdAt), { addSuffix: true }));
    };

    // Set up an interval to update every minute
    const intervalId = setInterval(updateTimeAgo, 60000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [createdAt]);

  return (
    <div className="mb-3">
      <div className="flex items-start">
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
          <span className="text-gray-600 font-bold text-sm">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline">
            <p className="mr-1 font-bold text-gray-900 dark:text-white">{user.username}</p>
            <p className="text-gray-800 dark:text-gray-200 break-words font-normal">{content}</p>
          </div>
          <div className="flex text-xs mt-1 text-gray-500 dark:text-gray-400 space-x-3">
            <span>{timeAgo}</span>
            {likeCount > 0 && <span>{likeCount} like{likeCount !== 1 ? 's' : ''}</span>}
            {replyCount > 0 && <span>{replyCount} repl{replyCount !== 1 ? 'ies' : 'y'}</span>}
            <button className="hover:text-gray-700 dark:hover:text-gray-300">Like</button>
            <button className="hover:text-gray-700 dark:hover:text-gray-300">Reply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
