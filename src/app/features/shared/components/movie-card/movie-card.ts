import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Movie } from '../../interfaces/movie';
import { StarRatingComponent } from '../star-rating/star-rating';
import { ReviewFormComponent } from '../review-form/review-form';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StarRatingComponent, ReviewFormComponent],
  template: `
    <div class="movie-card">
      <img [src]="movie.posterUrl" [alt]="movie.title" class="movie-poster" />
      <div class="movie-info">
        <h3>{{ movie.title }} ({{ movie.releaseDate | date:'yyyy' }})</h3>
        <div class="movie-categories">
          <span *ngFor="let category of movie.categories" class="category-tag">
            {{ category }}
          </span>
        </div>
        <p class="movie-description">{{ movie.description }}</p>
        <div class="movie-rating">
          <app-star-rating
            [rating]="movie.averageRating"
            [readonly]="true">
          </app-star-rating>
          <span class="rating-value">{{ movie.averageRating | number:'1.1-1' }}/5</span>
        </div>
        
        <div class="movie-details">
          <p><strong>Director:</strong> {{ movie.director || 'No especificado' }}</p>
          <p><strong>Duración:</strong> {{ movie.duration ? movie.duration + ' minutos' : 'No especificada' }}</p>
        </div>

        <div class="movie-actions">
          <div class="action-buttons">
            <button class="view-details" [routerLink]="['/movie', movie.id]">
              Ver más detalles
            </button>
            <button class="add-review" (click)="showReviewForm = true">
              <i class="fas fa-star"></i> Reseñar
            </button>
          </div>
        </div>

        @if (showReviewForm) {
          <div class="review-form-overlay">
            <app-review-form 
              [movieId]="movie.id"
              (cancel)="showReviewForm = false">
            </app-review-form>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .movie-card {
      display: flex;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
    }

    .movie-poster {
      width: 200px;
      height: 300px;
      object-fit: cover;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }

    .movie-info {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .movie-header {
      margin-bottom: 1rem;

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        color: #2c3e50;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #3498db;
        }
      }
    }

    .movie-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .category-tag {
      background: #f0f2f5;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.75rem;
      color: #2c3e50;
      transition: all 0.2s;

      &:hover {
        background: #e2e8f0;
        transform: translateY(-1px);
      }
    }

    .movie-meta {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;

      p {
        margin: 0.25rem 0;
        color: #2c3e50;
        font-size: 0.9rem;
      }
    }

    .movie-description {
      color: #34495e;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.5;
    }

    .movie-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #fff8e1;
      border-radius: 8px;
      width: fit-content;
    }

    .rating-value {
      font-weight: bold;
      color: #f39c12;
    }

    .movie-details {
      margin: 1rem 0;
      p {
        margin: 0.25rem 0;
      }
    }

    .movie-actions {
      margin-top: 1rem;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .view-details, .add-review {
      width: 100%;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .view-details {
      background: #3498db;
      color: white;

      &:hover {
        background: #2980b9;
        transform: translateY(-1px);
      }
    }

    .add-review {
      background: #2ecc71;
      color: white;

      &:hover {
        background: #27ae60;
        transform: translateY(-1px);
      }

      i {
        font-size: 0.9em;
      }
    }

    .review-form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;

      app-review-form {
        width: 100%;
        max-width: 600px;
      }
    }
  `]
})
export class MovieCardComponent {
  @Input() movie!: Movie;
  showReviewForm = false;

  onOverlayClick(event: MouseEvent) {
    // Solo cerrar si se hizo clic en el overlay, no en el formulario
    if ((event.target as HTMLElement).classList.contains('review-form-overlay')) {
      this.showReviewForm = false;
    }
  }

  onReviewSuccess() {
    this.showReviewForm = false;
    // Aquí podrías agregar una notificación de éxito si lo deseas
  }
}