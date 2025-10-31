import { Injectable } from '@angular/core';
import { Movie } from '../interfaces/movie';
import { Review } from '../interfaces/review';
import { SupabaseService } from './supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private moviesCache = new Map<string, Movie>();
  constructor(private supabase: SupabaseService) {
    console.log('[MovieService] initialized');
  }

  private getClient() {
    try {
      const client = this.supabase.getClient();
      console.log('[MovieService] Got Supabase client:', !!client);
      return client;
    } catch (err) {
      console.error('[MovieService] Error getting Supabase client:', err);
      throw err;
    }
  }

  async getAllMovies(): Promise<Movie[]> {
    try {
      const client = this.getClient();
      if (!client) {
        throw new Error('No se pudo obtener el cliente de Supabase');
      }

      const { data, error } = await client
        .from('movies')
        .select(`
          id,
          title,
          description,
          poster_url,
          release_date,
          director,
          duration,
          average_rating,
          created_at,
          created_by,
          movie_categories (
            categories (
              id,
              name
            )
          )
        `);

      if (error) {
        throw error;
      }

      const movies = this.transformMovieData(data || []);
      // Cachear para accesos rápidos desde detalles
      movies.forEach(m => this.moviesCache.set(m.id, m));
      return movies;
    } catch (err) {
      console.error('[MovieService] getAllMovies error:', err);
      return [];
    }
  }

  async getMoviesByCategory(categoryName: string): Promise<Movie[]> {
    console.log('[MovieService] getMoviesByCategory:', categoryName);
    try {
      const client = this.getClient();
      const { data: cats, error: catsErr } = await client
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .limit(1)
        .single();

      if (catsErr) {
        console.error('[MovieService] getMoviesByCategory catsErr:', catsErr);
        return [];
      }

      if (!cats) {
        console.log('[MovieService] Category not found:', categoryName);
        return [];
      }

      const { data, error } = await client
        .from('movie_categories')
        .select('movie:movies(id, title, description, poster_url, release_date, average_rating, created_at, created_by, director, duration, movie_categories ( categories ( id, name ) ))')
        .eq('category_id', cats.id);

      if (error) {
        console.error('[MovieService] getMoviesByCategory error:', error);
        return [];
      }

      const movies = (data || []).map((row: any) => row.movie);
      const transformed = this.transformMovieData(movies);
      console.log('[MovieService] Found', transformed.length, 'movies in category:', categoryName);
      return transformed;
    } catch (err) {
      console.error('[MovieService] getMoviesByCategory unexpected error:', err);
      return [];
    }
  }

  async getTopRatedMovies(limit: number = 10): Promise<Movie[]> {
    console.log('[MovieService] getTopRatedMovies - fetching top', limit);
    try {
      const client = this.getClient();
      if (!client) {
        throw new Error('No se pudo obtener el cliente de Supabase');
      }

      console.log('[MovieService] getTopRatedMovies - executing query...');
      
      const { data, error } = await client
        .from('movies')
        .select(`
          id,
          title,
          description,
          poster_url,
          release_date,
          average_rating,
          created_at,
          created_by,
          director,
          duration,
          movie_categories (
            categories (
              id,
              name
            )
          )
        `)
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[MovieService] getTopRatedMovies error:', error);
        throw error;
      }

      if (!data) {
        console.warn('[MovieService] No data returned from query');
        return [];
      }

      console.log('[MovieService] getTopRatedMovies raw data:', data);
      const movies = this.transformMovieData(data);
      console.log('[MovieService] getTopRatedMovies transformed:', movies.length, 'movies');
      return movies;
    } catch (err) {
      console.error('[MovieService] getTopRatedMovies unexpected error:', err);
      if (err instanceof Error) {
        console.error('[MovieService] Error details:', {
          message: err.message,
          stack: err.stack
        });
      }
      return [];
    }
  }

  async searchMovies(query: string): Promise<Movie[]> {
    console.log('[MovieService] searchMovies:', query);
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('movies')
        .select('id, title, description, poster_url, release_date, average_rating, created_at, created_by, director, duration, movie_categories ( categories ( id, name ) )')
        .ilike('title', `%${query}%`);

      if (error) {
        console.error('[MovieService] searchMovies error:', error);
        return [];
      }

      const movies = this.transformMovieData(data || []);
      console.log('[MovieService] searchMovies found:', movies.length);
      return movies;
    } catch (err) {
      console.error('[MovieService] searchMovies unexpected error:', err);
      return [];
    }
  }

  async addMovie(movie: Partial<Movie>, posterFile?: File): Promise<Movie | null> {
    console.log('[MovieService] addMovie:', movie.title);
    try {
      const client = this.getClient();
      let posterUrl = movie.posterUrl || null;

      if (posterFile) {
        try {
          const fileName = `${Date.now()}-${posterFile.name}`;
          const { error: uploadError } = await client
            .storage
            .from('bucket')
            .upload(fileName, posterFile);

          if (uploadError) {
            console.error('[MovieService] addMovie upload error:', uploadError);
          } else {
            const { data: urlData } = client.storage.from('bucket').getPublicUrl(fileName);
            posterUrl = (urlData as any)?.publicUrl || posterUrl;
          }
        } catch (e) {
          console.error('[MovieService] addMovie storage exception:', e);
        }
      }

      const durationNumber = movie.duration != null ? Number(movie.duration as any) : null;
      const payload = {
        title: movie.title,
        description: movie.description,
        poster_url: posterUrl,
        release_date: movie.releaseDate ? movie.releaseDate.toISOString().slice(0, 10) : null,
        director: movie.director ? String(movie.director) : null,
        duration: Number.isFinite(durationNumber as number) ? durationNumber : null
      } as any;

      const { data, error } = await client
        .from('movies')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[MovieService] addMovie insert error:', error);
        return null;
      }

      const created = data;

      const categories = (movie.categories || []) as string[];
      for (const catName of categories) {
        try {
          const { data: catData, error: selErr } = await client
            .from('categories')
            .select('id')
            .eq('name', catName)
            .limit(1);
          if (selErr) {
            console.error('[MovieService] categories select error:', selErr);
          }

          let categoryId = Array.isArray(catData) && catData[0] ? catData[0].id : null;
          if (!categoryId) {
            const { data: newCat, error: insErr } = await client
              .from('categories')
              .insert({ name: catName })
              .select()
              .single();
            if (insErr) {
              console.error('[MovieService] categories insert error:', insErr);
              continue;
            }
            categoryId = newCat?.id;
          }

          const { error: linkErr } = await client
            .from('movie_categories')
            .insert({ movie_id: created.id, category_id: categoryId });
          if (linkErr) {
            console.error('[MovieService] movie_categories insert error:', linkErr);
          }

        } catch (err) {
          console.error('[MovieService] Error adding category:', catName, err);
        }
      }

      const result = this.transformMovieData([created])[0];
      console.log('[MovieService] Movie added successfully:', result);
      return result;
    } catch (err) {
      console.error('[MovieService] addMovie unexpected error:', err);
      return null;
    }
  }

  async updateMovieRating(movieId: string, rating: number): Promise<boolean> {
    console.log('[MovieService] updateMovieRating:', movieId, rating);
    try {
      const client = this.getClient();
      const { error } = await client.rpc('update_movie_rating', {
        movie_id: movieId,
        new_rating: rating
      });

      if (error) {
        console.error('[MovieService] updateMovieRating error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[MovieService] updateMovieRating unexpected error:', err);
      return false;
    }
  }

  // ============ Reseñas 2.0 ============

  private async uploadReviewImage(file: File): Promise<string> {
    const client = this.getClient();
    const fileName = `reviews/${Date.now()}-${file.name}`;
    const { error: uploadError } = await client
      .storage
      .from('bucket') // o cambia a 'review-images' si usas otro bucket
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      console.error('[MovieService] uploadReviewImage error:', uploadError);
      throw uploadError;
    }
    const { data } = client.storage.from('bucket').getPublicUrl(fileName);
    return (data as any)?.publicUrl as string;
  }

  private async recalculateAverageRating(movieId: string) {
    const client = this.getClient();
    const { data: rows } = await client
      .from('reviews')
      .select('rating')
      .eq('movie_id', movieId);

    if (rows && rows.length > 0) {
      const avg = rows.reduce((a: number, r: any) => a + Number(r.rating), 0) / rows.length;
      await client.from('movies').update({ average_rating: avg }).eq('id', movieId);
    } else {
      await client.from('movies').update({ average_rating: 0 }).eq('id', movieId);
    }
  }

  async addReview(review: Partial<Review> & { pros?: string[]; cons?: string[]; containsSpoilers?: boolean; recommended?: boolean; imageFile?: File }): Promise<{success: boolean; error?: string}> {
    console.log('[MovieService] Iniciando addReview:', review);
    try {
      const client = this.getClient();
      if (!client) throw new Error('Cliente de Supabase no disponible');
      
      if (!review.movieId || !review.userId || !review.rating || !review.content) {
        console.error('[MovieService] Datos de reseña incompletos:', review);
        return { success: false, error: 'Datos de reseña incompletos' };
      }

      const { data: existingReview, error: checkError } = await client
        .from('reviews')
        .select('id')
        .eq('movie_id', review.movieId)
        .eq('user_id', review.userId)
        .maybeSingle();

      if (checkError) {
        console.error('[MovieService] Error al verificar reseña existente:', checkError);
        return { success: false, error: 'Error al verificar reseña existente' };
      }

      if (existingReview) {
        return { success: false, error: 'Ya has publicado una reseña para esta película' };
      }

      let imageUrl = review.imageUrl || '';
      if (review.imageFile) {
        imageUrl = await this.uploadReviewImage(review.imageFile);
      }

      const reviewData = {
        movie_id: review.movieId,
        user_id: review.userId,
        user_name: review.userName || review.userId,
        rating: Number(review.rating),
        content: review.content.trim(),
        pros: review.pros || [],
        cons: review.cons || [],
        contains_spoilers: !!review.containsSpoilers,
        recommended: review.recommended !== false,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[MovieService] Insertando reseña:', reviewData);

      const { error: insertError } = await client
        .from('reviews')
        .insert([reviewData]);

      if (insertError) {
        console.error('[MovieService] Error al insertar reseña:', insertError);
        return { success: false, error: 'Error al guardar la reseña' };
      }

      await this.recalculateAverageRating(review.movieId);
      return { success: true };
    } catch (err) {
      console.error('[MovieService] Error en addReview:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al publicar la reseña'
      };
    }
  }

  async updateReview(reviewId: string, updates: Partial<Review> & { pros?: string[]; cons?: string[]; containsSpoilers?: boolean; recommended?: boolean; imageFile?: File }): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();

      let imageUrl = updates.imageUrl;
      if (updates.imageFile) {
        imageUrl = await this.uploadReviewImage(updates.imageFile);
      }

      const toUpdate: any = {
        content: updates.content?.trim(),
        rating: updates.rating != null ? Number(updates.rating) : undefined,
        pros: updates.pros,
        cons: updates.cons,
        contains_spoilers: updates.containsSpoilers,
        recommended: updates.recommended,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      Object.keys(toUpdate).forEach(k => toUpdate[k] === undefined && delete toUpdate[k]);

      const { data, error } = await client
        .from('reviews')
        .update(toUpdate)
        .eq('id', reviewId)
        .select('movie_id')
        .single();

      if (error) return { success: false, error: 'No se pudo actualizar la reseña' };

      if (toUpdate.rating != null && data?.movie_id) {
        await this.recalculateAverageRating(data.movie_id);
      }
      return { success: true };
    } catch (err) {
      console.error('[MovieService] updateReview error:', err);
      return { success: false, error: 'Error al actualizar la reseña' };
    }
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select('movie_id')
        .single();

      if (error) return { success: false, error: 'No se pudo eliminar la reseña' };

      if (data?.movie_id) await this.recalculateAverageRating(data.movie_id);
      return { success: true };
    } catch (err) {
      console.error('[MovieService] deleteReview error:', err);
      return { success: false, error: 'Error al eliminar la reseña' };
    }
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ liked: boolean }> {
    const client = this.getClient();

    const { error } = await client
      .from('review_helpful_votes')
      .insert([{ review_id: reviewId, user_id: userId }]);

    if (!error) return { liked: true };

    await client
      .from('review_helpful_votes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId);

    return { liked: false };
  }

  async getMovieById(movieId: string): Promise<Movie | null> {
    console.log('[MovieService] getMovieById:', movieId);
    try {
      // Intento de cache primero
      const cached = this.moviesCache.get(movieId);
      if (cached) {
        console.log('[MovieService] getMovieById cache hit');
        return cached;
      }

      const client = this.getClient();
      const { data, error } = await client
        .from('movies')
        .select(`
          id,
          title,
          description,
          poster_url,
          release_date,
          director,
          duration,
          average_rating,
          created_at,
          created_by,
          movie_categories (
            categories (
              id,
              name
            )
          )
        `)
        .eq('id', movieId)
        .maybeSingle();

      if (error) {
        console.error('[MovieService] getMovieById error:', error);
        // Continuamos a un fallback simple
      }

      if (data) {
        const movie = this.transformMovieData([data])[0];
        if (movie) this.moviesCache.set(movie.id, movie);
        return movie;
      }

      // Fallback: consulta básica sin joins
      const { data: basic, error: basicErr } = await client
        .from('movies')
        .select('id, title, description, poster_url, release_date, average_rating, created_at, created_by, director, duration')
        .eq('id', movieId)
        .maybeSingle();

      if (basicErr) {
        console.error('[MovieService] getMovieById basic error:', basicErr);
        return null;
      }

      if (!basic) {
        console.warn('[MovieService] Movie not found for id (fallback):', movieId);
        return null;
      }

      const fallback = this.transformMovieData([basic])[0];
      if (fallback) this.moviesCache.set(fallback.id, fallback);
      return fallback;
    } catch (err) {
      console.error('[MovieService] getMovieById unexpected error:', err);
      return null;
    }
  }

  async getReviews(movieId: string, currentUserId?: string): Promise<Review[]> {
    console.log('[MovieService] Obteniendo reseñas para película:', movieId);
    try {
      const client = this.getClient();
      if (!client) throw new Error('Cliente de Supabase no disponible');

      const { data, error } = await client
        .from('reviews')
        .select(`
          id,
          movie_id,
          user_id,
          user_name,
          rating,
          content,
          image_url,
          pros,
          cons,
          contains_spoilers,
          recommended,
          helpful_count,
          created_at,
          updated_at
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MovieService] Error al obtener reseñas:', error);
        throw error;
      }

      const reviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        movieId: r.movie_id,
        userId: r.user_id,
        userName: r.user_name,
        rating: Number(r.rating),
        content: r.content,
        imageUrl: r.image_url || '',
        pros: r.pros || [],
        cons: r.cons || [],
        containsSpoilers: !!r.contains_spoilers,
        recommended: r.recommended !== false,
        helpfulCount: Number(r.helpful_count) || 0,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at)
      }));

      if (currentUserId && reviews.length) {
        const ids = reviews.map(r => r.id);
        const { data: flags } = await client
          .from('review_helpful_votes')
          .select('review_id')
          .eq('user_id', currentUserId)
          .in('review_id', ids);

        const likedSet = new Set((flags || []).map((f: any) => f.review_id));
        (reviews as (Review & { helpfulByCurrentUser?: boolean })[]).forEach(r => {
          r.helpfulByCurrentUser = likedSet.has(r.id);
        });
      }

      console.log('[MovieService] Reseñas obtenidas:', reviews.length);
      return reviews;

    } catch (err) {
      console.error('[MovieService] Error inesperado en getReviews:', err);
      throw err;
    }
  }

  async getUserReviews(username: string): Promise<Review[]> {
    console.log('[MovieService] Obteniendo reseñas del usuario:', username);
    try {
      const client = this.getClient();
      if (!client) throw new Error('Cliente de Supabase no disponible');

      const { data, error } = await client
        .from('reviews')
        .select(`
          id,
          movie_id,
          user_id,
          user_name,
          rating,
          content,
          image_url,
          pros,
          cons,
          contains_spoilers,
          recommended,
          helpful_count,
          created_at,
          updated_at,
          movies:movie_id (
            id,
            title,
            poster_url
          )
        `)
        .eq('user_id', username)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MovieService] Error al obtener reseñas del usuario:', error);
        throw error;
      }

      const reviews = (data || []).map((review: any) => {
        const moviesRel = Array.isArray(review.movies) ? review.movies[0] : review.movies;

        return {
          id: review.id,
          movieId: review.movie_id,
          userId: review.user_id,
          userName: review.user_name,
          rating: Number(review.rating),
          content: review.content,
          imageUrl: review.image_url || '',
          pros: review.pros || [],
          cons: review.cons || [],
          containsSpoilers: !!review.contains_spoilers,
          recommended: review.recommended !== false,
          helpfulCount: Number(review.helpful_count) || 0,
          createdAt: new Date(review.created_at),
          updatedAt: new Date(review.updated_at),
          movie: moviesRel ? {
            id: review.movie_id,
            title: moviesRel.title,
            description: '',
            posterUrl: moviesRel.poster_url,
            releaseDate: new Date(),
            categories: [],
            averageRating: 0,
            createdAt: new Date(),
            createdBy: '',
            director: '',
            duration: 0
          } : undefined
        } as Review;
      });

      console.log('[MovieService] Reseñas del usuario obtenidas:', reviews.length);
      return reviews;

    } catch (err) {
      console.error('[MovieService] Error inesperado en getUserReviews:', err);
      throw err;
    }
  }

  private transformMovieData(data: any[]): Movie[] {
    if (!data) {
      return [];
    }

    const arrayData = Array.isArray(data) ? data : [data];
    
    if (arrayData.length === 0) {
      return [];
    }

    try {
      return arrayData.map(item => {
        const categories = item.movie_categories 
          ? item.movie_categories
              .map((mc: any) => mc.categories?.name)
              .filter(Boolean)
          : [];
      
        return {
          id: item.id || `movie-${Date.now()}`,
          title: item.title || 'Sin título',
          description: item.description || 'Sin descripción',
          posterUrl: item.poster_url || 'https://via.placeholder.com/300x450',
          releaseDate: item.release_date ? new Date(item.release_date) : new Date(),
          categories: categories,
          averageRating: Number(item.average_rating) || 0,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          createdBy: item.created_by || 'unknown',
          director: item.director || null,
          duration: item.duration ? Number(item.duration) : null
        };
      });
    } catch (err) {
      console.error('[MovieService] Error transforming data:', err);
      return [];
    }
  }
}