export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  postId: number;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  user: User;
  _count?: {
    likes: number;
    replies: number;
  };
  likeCount: number;
  replyCount: number;
}

export interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  comments: Comment[];
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FeedsResponse {
  message: string;
  data: Post[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
