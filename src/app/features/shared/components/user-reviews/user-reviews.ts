import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Review } from '../../interfaces/review';
import { Movie } from '../../interfaces/movie';
import { MovieService } from '../../services/movie.service';
import { StarRatingComponent } from '../star-rating/star-rating';

@Component({
  selector: 'app-user-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, StarRatingComponent],
  template: `
    <div class="user-reviews">
      <h3 class="section-title">Mis Reseñas</h3>
      
      @if (isLoading) {
        <div class="loading-state">
          <p>Cargando reseñas...</p>
        </div>
      } @else if (error) {
        <div class="error-state">
          <p>{{ error }}</p>
          <button (click)="loadReviews()">Reintentar</button>
        </div>
      } @else if (reviews.length === 0) {
        <div class="empty-state">
          <p>Aún no has publicado ninguna reseña</p>
          <a routerLink="/catalog" class="browse-link">
            Explorar películas
          </a>
        </div>
      } @else {
        <div class="reviews-grid">
          @for (review of reviews; track review.id) {
            <div class="review-card">
              <div class="movie-info">
                <img [src]="review.movie?.posterUrl || 'assets/placeholder.jpg'" 
                     [alt]="review.movie?.title || 'Película'"
                     class="movie-poster"
                     [routerLink]="['/movie', review.movieId]"/>
                <div class="movie-details">
                  <h4 [routerLink]="['/movie', review.movieId]">
                    {{ review.movie?.title || 'Película no disponible' }}
                  </h4>
                  <app-star-rating [rating]="review.rating" [readonly]="true">
                  </app-star-rating>
                  <span class="review-date">
                    {{ review.createdAt | date:'dd/MM/yyyy' }}
                  </span>
                  @if (review.containsSpoilers) { <span class="spoiler-badge">Contiene spoilers</span> }
                  @if (review.recommended === false) { <span class="tag neg">No recomendada</span> } @else { <span class="tag">Recomendada</span> }
                </div>
              </div>
              
              <p class="review-content">{{ review.content }}</p>
              
              @if (review.pros?.length) {
                <div class="tags"><span class="tag" *ngFor="let t of review.pros">+ {{ t }}</span></div>
              }
              @if (review.cons?.length) {
                <div class="tags"><span class="tag neg" *ngFor="let t of review.cons">- {{ t }}</span></div>
              }

              @if (review.imageUrl) {
                <img [src]="review.imageUrl" 
                     alt="Imagen de la reseña" 
                     class="review-image"
                     (click)="openImage(review.imageUrl)"/>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .user-reviews {
      padding: 1rem;
    }

    .section-title {
      font-size: 1.5rem;
      color: #2c3e50;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #3498db;
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .movie-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .movie-poster {
      width: 80px;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .movie-details {
      flex: 1;
      
      h4 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        color: #2c3e50;
        cursor: pointer;

        &:hover {
          color: #3498db;
        }
      }
    }

    .review-date {
      display: block;
      font-size: 0.8rem;
      color: #95a5a6;
      margin-top: 0.5rem;
    }

    .review-content {
      color: #34495e;
      line-height: 1.5;
      margin: 1rem 0;
    }

    .review-image {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }

    .spoiler-badge { display:inline-block; background:#fff3cd; color:#856404; padding:.25rem .5rem; border-radius:6px; margin-top:.25rem; font-size:.85rem; }
    .tags { display:flex; gap:.5rem; flex-wrap:wrap; margin:.25rem 0; }
    .tag { background:#eef7ff; color:#1f6feb; padding:.2rem .5rem; border-radius:12px; font-size:.85rem; }
    .tag.neg { background:#fdecea; color:#c0392b; }

    .empty-state {
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      
      p {
        color: #7f8c8d;
        margin-bottom: 1rem;
      }
    }

    .browse-link {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background: #2980b9;
      }
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 2rem;
    }

    .error-state button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #2980b9;
      }
    }
  `]
})
export class UserReviewsComponent implements OnInit {
  @Input() username!: string;
  reviews: (Review & { movie?: Movie })[] = [];
  isLoading = false;
  error = '';

  constructor(private movieService: MovieService) {}

  ngOnInit() {
    this.loadReviews();
  }

  async loadReviews() {
    console.log('[UserReviews] Iniciando carga de reseñas para:', this.username);
    this.isLoading = true;
    this.error = '';

    try {
      const reviews = await this.movieService.getUserReviews(this.username);
      console.log('[UserReviews] Reseñas obtenidas:', reviews);
      this.reviews = reviews.filter(review => review.movie !== undefined);
      console.log('[UserReviews] Reseñas procesadas:', this.reviews.length);

    } catch (err) {
      console.error('[UserReviews] Error al cargar reseñas:', err);
      this.error = 'Error al cargar las reseñas. Por favor intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }
}