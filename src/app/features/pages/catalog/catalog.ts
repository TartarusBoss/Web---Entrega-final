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

        <div class="filters">
          <select [(ngModel)]="selectedCategory" (ngModelChange)="filterByCategory()">
            <option value="">Todas las categorías</option>
            <option *ngFor="let category of categories" [value]="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>

      <!-- Estado de carga -->
      <div *ngIf="isLoading" class="loading-state">
        <p>Cargando películas...</p>
      </div>

      <!-- Estado de error -->
      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button (click)="loadMovies()">Reintentar</button>
      </div>

      <!-- Sin resultados -->
      <div *ngIf="!isLoading && !error && filteredMovies.length === 0" class="empty-state">
        <p>No se encontraron películas</p>
      </div>

      <!-- Lista de películas -->
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
      display:flex; 
      align-items:center; 
      justify-content:space-between; 
      gap:1rem;
    }

    .btn-add {
      background:#2ecc71; 
      color:white; 
      padding:0.5rem 0.75rem; 
      border-radius:6px; 
      text-decoration:none; 
      font-weight:600;
      
      &:hover {
        background: #27ae60;
      }
    }

    h1 {
      margin-bottom: 1.5rem;
      color: #2c3e50;
    }

    .search-bar {
      margin-bottom: 1rem;
      
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

    .filters {
      margin-bottom: 2rem;
      
      select {
        padding: 0.5rem;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        
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
export class CatalogComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  categories: string[] = [];
  searchQuery: string = '';
  selectedCategory: string = '';
  isLoading: boolean = true;
  error: string = '';

  constructor(private movieService: MovieService) {
    console.log('[Catalog] Constructor called');
  }

  ngOnInit() {
    this.loadMovies().catch(err => {
      console.error('[Catalog] Initial load failed:', err);
      this.error = 'Error al cargar las películas. Por favor intenta de nuevo.';
    });
  }

  async loadMovies() {
    console.log('[Catalog] Starting to load movies...');
    this.isLoading = true;
    this.error = '';
    
    try {
      console.log('[Catalog] Calling movie service...');
      this.movies = await this.movieService.getAllMovies();
      console.log('[Catalog] Got response from service:', this.movies);
      
      if (!this.movies || this.movies.length === 0) {
        console.log('[Catalog] No movies returned');
        this.error = 'No se encontraron películas disponibles.';
        return;
      }

      this.filteredMovies = [...this.movies];
      this.categories = this.getUniqueCategories();
      console.log('[Catalog] Processing complete. Movies:', this.movies.length, 'Categories:', this.categories);
    } catch (err) {
      console.error('[Catalog] Error loading movies:', err);
      this.error = 'Error al cargar las películas. Por favor intenta de nuevo.';
    } finally {
      console.log('[Catalog] Setting loading state to false');
      this.isLoading = false;
    }
  }

  private getUniqueCategories(): string[] {
    const categoriesSet = new Set<string>();
    this.movies.forEach(movie => {
      movie.categories.forEach(category => categoriesSet.add(category));
    });
    return Array.from(categoriesSet).sort();
  }

  onSearch(): void {
    this.filterMovies();
  }

  filterByCategory(): void {
    this.filterMovies();
  }

  private filterMovies(): void {
    this.filteredMovies = this.movies.filter(movie => {
      const matchesSearch = this.searchQuery 
        ? movie.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      
      const matchesCategory = this.selectedCategory
        ? movie.categories.includes(this.selectedCategory)
        : true;

      return matchesSearch && matchesCategory;
    });
  }
}