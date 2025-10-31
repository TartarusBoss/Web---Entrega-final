import { Movie } from './movie';

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  movie?: Movie;

  // Nuevos campos
  pros?: string[];
  cons?: string[];
  containsSpoilers?: boolean;
  recommended?: boolean;
  helpfulCount?: number;

  // Estado por-usuario (no persistente)
  helpfulByCurrentUser?: boolean;
}

export interface ReviewWithMovie extends Review {
  movie: Movie;
}