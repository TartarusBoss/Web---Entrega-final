import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../shared/services/movie.service';
import { Movie } from '../../shared/interfaces/movie';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { Review } from '../../shared/interfaces/review';
import { Auth } from '../../shared/services/auth';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, ReviewFormComponent],
  template: `
    <div class="movie-details-page">
      @if (isLoading) {
        <div class="loading-state">
          <i class="fas fa-circle-notch fa-spin"></i>
          <p>Cargando película...</p>
        </div>
      } @else if (error) {
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error }}</p>
          <button (click)="retry()">Reintentar</button>
        </div>
      } @else if (movie) {
        <div class="movie-content">
          <div class="movie-header">
            <div class="poster-container">
              <img [src]="movie.posterUrl" [alt]="movie.title" class="movie-poster">
              @if (auth.isLogged()) {
                @if (!userReview) {
                  <button class="review-button" (click)="showForm = true">
                    <i class="fas fa-star"></i>
                    <span>Escribir reseña</span>
                  </button>
                }
              } @else {
                <button class="login-button" (click)="goToLogin()">
                  <i class="fas fa-sign-in-alt"></i>
                  <span>Iniciar sesión para reseñar</span>
                </button>
              }
            </div>
            
            <div class="movie-info">
              <h1>{{ movie.title }}</h1>
              
              <div class="meta-info">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>{{ movie.releaseDate | date:'yyyy' }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-user"></i>
                  <span>{{ movie.director || 'Director no especificado' }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ movie.duration || '?' }} min</span>
                </div>
              </div>

              <div class="movie-rating">
                <app-star-rating 
                  [rating]="movie.averageRating" 
                  [readonly]="true"
                  [size]="'large'">
                </app-star-rating>
                <div class="rating-info">
                  <span class="rating-value">{{ movie.averageRating | number:'1.1-1' }}</span>
                  <span class="rating-count">{{ reviews.length }} reseñas</span>
                </div>
              </div>

              <p class="movie-description">{{ movie.description }}</p>

              @if (movie.categories && movie.categories.length > 0) {
                <div class="categories">
                  @for (category of movie.categories; track category) {
                    <span class="category-tag">{{ category }}</span>
                  }
                </div>
              }
            </div>
          </div>

          @if (showForm && movie) {
            <div style="padding: 0 2rem 1rem;">
              <app-review-form
                [movieId]="movie.id"
                (cancel)="showForm = false; editMode = false"
                (success)="reloadReviews()">
              </app-review-form>
            </div>
          }

          <div class="reviews-section">
            @if (userReview) {
              <div class="user-review-section">
                <h2>Tu reseña</h2>
                <div class="review-card highlight">
                  <div class="review-header">
                    <div class="user-info">
                      <i class="fas fa-user-circle"></i>
                      <span>{{ userReview.userName }}</span>
                    </div>
                    <app-star-rating [rating]="userReview.rating" [readonly]="true">
                    </app-star-rating>
                  </div>

                  
                  <p class="review-content">{{ userReview.content }}</p>
                  @if (userReview.imageUrl) {
                    <img [src]="userReview.imageUrl" class="review-image" />
                  }
                  <div class="review-footer">
                    <span class="date">{{ userReview.createdAt | date:'dd MMM yyyy' }}</span>
                    <div class="actions">
                      <button (click)="editMode = true; showForm = true">Editar</button>
                      <button class="danger" (click)="onDelete(userReview.id)">Borrar</button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <div class="other-reviews">
              <h2>Reseñas de otros usuarios</h2>
              @if (filteredReviews.length === 0) {
                <div class="empty-state">
                  <p>No hay reseñas de otros usuarios aún</p>
                </div>
              } @else {
                <div class="reviews-grid">
                  @for (review of filteredReviews; track review.id) {
                    <div class="review-card">
                      <div class="review-header">
                        <div class="user-info">
                          <i class="fas fa-user-circle"></i>
                          <span>{{ review.userName }}</span>
                        </div>
                        <app-star-rating [rating]="review.rating" [readonly]="true">
                        </app-star-rating>
                      </div>
                      
                      <p class="review-content">{{ review.content }}</p>
                      @if (review.imageUrl) {
                        <img [src]="review.imageUrl" class="review-image" />
                      }
                      <div class="review-footer">
                        <span class="date">{{ review.createdAt | date:'dd MMM yyyy' }}</span>
                        
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .movie-details-page {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      color: #2c3e50;

      i {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #3498db;
      }

      p {
        margin-bottom: 1rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }
      }
    }

    .error-state i {
      color: #e74c3c;
    }

    .movie-content {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .movie-header {
      display: flex;
      gap: 2rem;
      padding: 2rem;
      background: linear-gradient(to bottom, #f8f9fa, white);
    }

    .poster-container {
      position: relative;
      flex-shrink: 0;
    }

    .movie-poster {
      width: 300px;
      height: 450px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .review-button, .login-button {
      position: absolute;
      left: 50%;
      bottom: 2rem;
      transform: translateX(-50%);
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      white-space: nowrap;
    }

    .review-button {
      background: #2ecc71;
      color: white;

      &:hover {
        background: #27ae60;
        transform: translate(-50%, -2px);
      }
    }

    .login-button {
      background: #3498db;
      color: white;

      &:hover {
        background: #2980b9;
        transform: translate(-50%, -2px);
      }
    }

    .movie-info {
      flex: 1;
      
      h1 {
        font-size: 2.5rem;
        color: #2c3e50;
        margin: 0 0 1.5rem;
        line-height: 1.2;
      }

      .meta-info {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 2rem;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;

          i {
            font-size: 1.1rem;
            color: #95a5a6;
          }
        }
      }

      .movie-rating {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: #fff8e1;
        border-radius: 12px;
        margin-bottom: 2rem;

        .rating-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          .rating-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #f39c12;
          }

          .rating-count {
            font-size: 0.9rem;
            color: #95a5a6;
          }
        }
      }

      .movie-description {
        font-size: 1.1rem;
        line-height: 1.7;
        color: #34495e;
        margin-bottom: 2rem;
      }

      .categories {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        .category-tag {
          padding: 0.5rem 1rem;
          background: #f0f2f5;
          border-radius: 20px;
          color: #2c3e50;
          font-size: 0.9rem;
          transition: all 0.2s;

          &:hover {
            background: #e9ecef;
            transform: translateY(-1px);
          }
        }
      }
    }

    .reviews-section {
      padding: 2rem;

      h2 {
        font-size: 1.75rem;
        color: #2c3e50;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #f8f9fa;
      }
    }

    .user-review-section {
      margin-bottom: 3rem;
    }

    .review-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      transition: all 0.2s;

      &.highlight {
        background: #e8f6ff;
        border: 1px solid #3498db;
      }

      .review-header, .review-rating {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i {
            font-size: 1.25rem;
            color: #95a5a6;
          }
        }
      }

      .review-content {
        color: #2c3e50;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .date {
        font-size: 0.9rem;
        color: #95a5a6;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
      }
    }

    .spoiler-badge { display:inline-block; background:#fff3cd; color:#856404; padding:.25rem .5rem; border-radius:6px; margin-bottom:.5rem; font-size:.85rem; }
    .tags { display:flex; gap:.5rem; flex-wrap:wrap; margin:.5rem 0; }
    .tag { background:#eef7ff; color:#1f6feb; padding:.2rem .5rem; border-radius:12px; font-size:.85rem; }
    .tag.neg { background:#fdecea; color:#c0392b; }

    .review-image {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 8px;
      margin-top: .5rem;
    }

    .review-footer {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-top:.5rem;
    }
    .review-footer .actions button { border:1px solid #e0e0e0; background:#f8f9fa; padding:.35rem .6rem; border-radius:6px; }
    .review-footer .actions .danger { background:#ffe8e6; color:#c0392b; border-color:#ffd1cc; }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .no-reviews {
      text-align: center;
      padding: 4rem 2rem;

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        i {
          font-size: 3rem;
          color: #95a5a6;
        }

        p {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        button {
          margin-top: 1rem;
        }
      }
    }

    @media (max-width: 768px) {
      .movie-header {
        flex-direction: column;
      }

      .poster-container {
        display: flex;
        justify-content: center;
      }

      .movie-poster {
        width: 250px;
        height: 375px;
      }

      .reviews-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MovieDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  protected auth = inject(Auth);
  
  movie: Movie | null = null;
  reviews: Review[] = [];
  userReview: Review | null = null;
  isLoading = true;
  error = '';

  showForm = false;
  editMode = false;

  private withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise
        .then(v => { clearTimeout(t); resolve(v); })
        .catch(e => { clearTimeout(t); reject(e); });
    });
  }

  protected get filteredReviews(): Review[] {
    const currentUser = this.auth.getUserLogged()?.username;
    return this.reviews.filter(r => r.userId !== currentUser);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const movieId = (params.get('id') || '').trim();
      if (movieId) {
        this.loadMovie(movieId);
      } else {
        this.error = 'ID de película no encontrado';
        this.isLoading = false;
      }
    });
  }

  protected retry() {
    const movieId = this.route.snapshot.paramMap.get('id');
    if (movieId) {
      this.loadMovie(movieId);
    } else {
      this.error = 'ID de película no encontrado';
    }
  }

  private async loadMovie(id: string) {
    console.log('[MovieDetails] Iniciando carga de película:', id);
    this.isLoading = true;
    this.error = '';

    try {
      const currentUser = this.auth.getUserLogged()?.username || '';
      const [movie, reviews] = await Promise.all([
        this.withTimeout(this.movieService.getMovieById(id), 8000),
        this.withTimeout(this.movieService.getReviews(id, currentUser), 8000)
      ]);

      console.log('[MovieDetails] Datos obtenidos:', {
        movie,
        reviewsCount: reviews?.length
      });

      if (!movie) {
        this.error = 'No se encontró la película';
        return;
      }

      this.movie = movie;
      this.reviews = reviews;
      this.updateUserReview();

    } catch (err) {
      console.error('[MovieDetails] Error al cargar datos:', err);
      this.error = (err instanceof Error && err.message === 'timeout')
        ? 'Tiempo de espera agotado al cargar los detalles. Reintenta.'
        : 'Error al cargar los detalles de la película';
    } finally {
      this.isLoading = false;
    }
  }

  private updateUserReview() {
    const user = this.auth.getUserLogged();
    if (!user || !this.reviews) return;

    this.userReview = this.reviews.find(r => r.userId === user.username) || null;
    console.log('[MovieDetails] Review del usuario actualizada:', this.userReview);
  }

  async reloadReviews() {
    if (!this.movie) return;
    const user = this.auth.getUserLogged()?.username || '';
    this.reviews = await this.movieService.getReviews(this.movie.id, user);
    this.updateUserReview();
    this.showForm = false;
    this.editMode = false;
  }

  async onDelete(reviewId: string) {
    const ok = confirm('¿Eliminar tu reseña?');
    if (!ok) return;
    const res = await this.movieService.deleteReview(reviewId);
    if (!res.success) return;
    await this.reloadReviews();
  }

  async onHelpful(review: Review) {
    const user = this.auth.getUserLogged()?.username;
    if (!user) { this.goToLogin(); return; }
    const { liked } = await this.movieService.toggleHelpful(review.id, user);
    const r: any = review as any;
    r.helpfulByCurrentUser = liked;
    r.helpfulCount = ((r.helpfulCount as number) || 0) + (liked ? 1 : -1);
  }

  protected goToLogin() {
    this.router.navigate(['/login']);
  }
}