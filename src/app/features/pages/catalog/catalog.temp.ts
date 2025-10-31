import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../shared/services/movie.service';
import { RouterLink } from '@angular/router';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card';
import { Movie } from '../../shared/interfaces/movie';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCardComponent, RouterLink],
  template: `
    <div class="catalog-container">
      <div class="catalog-header">
        <div class="catalog-top">
          <h1>Catálogo de Películas</h1>
          <a class="btn-add" routerLink="/agregar-pelicula">➕ Agregar película</a>
        </div>
        
        <div class="search-bar">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearch()"
            placeholder="Buscar películas..."
          />
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="isLoading" class="state-message">
        <p>Cargando películas...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="error" class="state-message error">
        <p>{{ error }}</p>
        <button (click)="loadMovies()">Reintentar</button>
      </div>

      <!-- Empty state -->
      <div *ngIf="!isLoading && !error && filteredMovies.length === 0" class="state-message">
        <p>No se encontraron películas</p>
      </div>

      <!-- Movies grid -->
      <div *ngIf="!isLoading && !error && filteredMovies.length > 0" class="movies-grid">
        <app-movie-card
          *ngFor="let movie of filteredMovies"
          [movie]="movie"
        ></app-movie-card>
      </div>
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .catalog-header {
      margin-bottom: 2rem;
    }

    .catalog-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .btn-add {
      background: #2ecc71;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        background: #27ae60;
      }
    }

    .search-bar {
      margin-bottom: 1.5rem;
      
      input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #3498db;
        }
      }
    }

    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }

    .state-message {
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 2rem 0;

      &.error {
        background: #fee;
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
    }
  `]
})
export class CatalogComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;
  error: string = '';

  constructor(private movieService: MovieService) {}

  async ngOnInit() {
    await this.loadMovies();
  }

  async loadMovies() {
    this.isLoading = true;
    this.error = '';
    
    try {
      console.log('[Catalog] Loading movies...');
      this.movies = await this.movieService.getAllMovies();
      this.filteredMovies = [...this.movies];
      console.log('[Catalog] Movies loaded:', this.movies.length);
    } catch (err) {
      console.error('[Catalog] Error loading movies:', err);
      this.error = 'Error al cargar las películas. Por favor intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredMovies = [...this.movies];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredMovies = this.movies.filter(movie => 
      movie.title.toLowerCase().includes(query) || 
      movie.description.toLowerCase().includes(query)
    );
  }
}