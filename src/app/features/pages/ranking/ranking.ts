import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../shared/services/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card';
import { Movie } from '../../shared/interfaces/movie';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  template: `
    <div class="ranking-container">
      <h1>🏆 Top Películas Mejor Valoradas</h1>

      <!-- Estado de carga -->
      <div *ngIf="isLoading" class="loading-state">
        <p>Cargando ranking de películas...</p>
      </div>

      <!-- Estado de error -->
      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button (click)="loadTopMovies()">Reintentar</button>
      </div>

      <!-- Sin películas -->
      <div *ngIf="!isLoading && !error && topMovies.length === 0" class="empty-state">
        <p>No hay películas valoradas todavía</p>
      </div>

      <!-- Lista de películas -->
      <div *ngIf="!isLoading && !error && topMovies.length > 0" class="ranking-list">
        <div *ngFor="let movie of topMovies; let i = index" class="ranking-item">
          <div class="rank-number">{{ i + 1 }}</div>
          <app-movie-card [movie]="movie"></app-movie-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ranking-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 2rem;
      color: #2c3e50;
      text-align: center;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
    }

    .rank-number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #f1c40f;
      min-width: 60px;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }

    :host ::ng-deep .movie-card {
      flex: 1;
    }

    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 2rem 0;
    }

    .loading-state {
      color: #2c3e50;
    }

    .error-state {
      color: #e74c3c;
      
      button {
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
    }

    .empty-state {
      color: #7f8c8d;
    }
  `]
})
export class RankingComponent implements OnInit {
  topMovies: Movie[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(private movieService: MovieService) {
    console.log('[Ranking] Constructor called');
  }

  ngOnInit() {
    console.log('[Ranking] ngOnInit called, initiating load...');
    // Usar setTimeout para asegurarnos de que la carga se inicie después de la inicialización completa
    setTimeout(() => {
      this.loadTopMovies().catch(err => {
        console.error('[Ranking] Initial load failed:', err);
        this.error = 'Error al cargar las películas. Por favor intenta de nuevo.';
      });
    }, 0);
  }

  async loadTopMovies() {
    this.isLoading = true;
    this.error = '';
    
    try {
      console.log('[Ranking] Loading top movies...');
      this.topMovies = await this.movieService.getTopRatedMovies(10);
      console.log('[Ranking] Top movies loaded:', this.topMovies.length);
    } catch (err) {
      console.error('[Ranking] Error loading top movies:', err);
      this.error = 'Error al cargar el ranking. Por favor intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }
}