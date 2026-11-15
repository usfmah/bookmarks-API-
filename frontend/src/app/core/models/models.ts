export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: number;
  title: string;
  link: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface AuthResponse {
  access_token: string;
}

export interface CreateBookmarkPayload {
  title: string;
  link: string;
  description?: string;
}

export interface UpdateBookmarkPayload {
  title?: string;
  link?: string;
  description?: string;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
}
