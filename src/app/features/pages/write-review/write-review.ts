import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { MovieService } from '../../shared/services/movie.service';
import { Auth } from '../../shared/services/auth';
import { Movie } from '../../shared/interfaces/movie';

@Component({
  selector: 'app-write-review',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  template: `
    <div class="write-review-page">
      @if (isLoading) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Cargando...</p>
        </div>
      } @else if (!auth.isLogged()) {
        <div class="login-required">
          <i class="fas fa-user-circle"></i>
          <h2>Necesitas iniciar sesión</h2>
          <p>Para escribir una reseña, primero debes iniciar sesión</p>
          <button (click)="navigateToLogin()">Iniciar sesión</button>
        </div>
      } @else if (hasReviewed) {
        <div class="already-reviewed">
          <i class="fas fa-check-circle"></i>
          <h2>Ya has publicado una reseña</h2>
          <p>Ya has compartido tu opinión sobre esta película</p>
          <button (click)="navigateBack()">Volver a la película</button>
        </div>
      } @else if (movie) {
        <header class="review-header">
          <button class="back-button" (click)="navigateBack()">
            <i class="fas fa-arrow-left"></i>
            Volver
          </button>
          <h1>Escribir reseña</h1>
        </header>

        <div class="movie-info">
          <img [src]="movie.posterUrl" [alt]="movie.title" class="movie-poster">
          <div class="movie-details">
            <h2>{{ movie.title }}</h2>
            <p class="movie-meta">
              <span>{{ movie.releaseDate | date:'yyyy' }}</span>
              <span *ngIf="movie.director">· {{ movie.director }}</span>
            </p>
          </div>
        </div>

        <form class="review-form" (submit)="submitReview(); $event.preventDefault()">
          <div class="rating-section">
            <label>Tu calificación</label>
            <app-star-rating
              [(rating)]="review.rating"
              [readonly]="false"
              [size]="'large'">
            </app-star-rating>
            <p class="rating-text">{{ getRatingText() }}</p>
          </div>

          <div class="content-section">
            <label for="review-content">Tu opinión</label>
            <textarea
              id="review-content"
              [(ngModel)]="review.content"
              name="content"
              [maxlength]="maxContentLength"
              rows="6"
              placeholder="¿Qué te pareció la película? Comparte tu experiencia..."
              [disabled]="isSubmitting">
            </textarea>
            <div class="char-count">
              {{ review.content.length }}/{{ maxContentLength }}
            </div>
          </div>

          <div class="image-section">
            <label>Añadir imagen (opcional)</label>
            <div class="image-upload"
                 [class.has-file]="!!imageFile"
                 [class.dragging]="isDragging"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">
              <input
                type="file"
                #fileInput
                accept="image/*"
                (change)="handleImageUpload($event)"
                [disabled]="isSubmitting"
                style="display: none">

              @if (!imageFile) {
                <div class="upload-placeholder">
                  <i class="fas fa-camera"></i>
                  <p>Arrastra una imagen aquí o</p>
                  <button type="button" 
                          [disabled]="isSubmitting"
                          (click)="fileInput.click()">
                    Seleccionar imagen
                  </button>
                </div>
              } @else {
                <div class="file-preview">
                  <img [src]="previewUrl" alt="Vista previa">
                  <button type="button"
                          class="remove-image"
                          [disabled]="isSubmitting"
                          (click)="removeImage()">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
            </div>
          </div>

          @if (error) {
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ error }}
            </div>
          }

          <div class="form-actions">
            <button type="button" 
                    class="cancel-button" 
                    [disabled]="isSubmitting"
                    (click)="navigateBack()">
              Cancelar
            </button>
            <button type="submit"
                    class="submit-button"
                    [disabled]="!isValid || isSubmitting">
              @if (isSubmitting) {
                <i class="fas fa-spinner fa-spin"></i>
                Publicando...
              } @else {
                <i class="fas fa-paper-plane"></i>
                Publicar reseña
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .write-review-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .loading {
      text-align: center;
      padding: 4rem;
      color: #2c3e50;
    }

    .loading i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .login-required, .already-reviewed {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .login-required i, .already-reviewed i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .login-required i {
      color: #95a5a6;
    }

    .already-reviewed i {
      color: #27ae60;
    }

    .login-required h2, .already-reviewed h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .login-required p, .already-reviewed p {
      color: #7f8c8d;
      margin-bottom: 1.5rem;
    }

    .login-required button {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .login-required button:hover {
      background: #2980b9;
      transform: translateY(-1px);
    }

    .already-reviewed button {
      background: #2ecc71;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .already-reviewed button:hover {
      background: #27ae60;
      transform: translateY(-1px);
    }

    .review-header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }

    .back-button {
      background: none;
      border: none;
      color: #2c3e50;
      font-size: 1rem;
      padding: 0.5rem;
      cursor: pointer;
      margin-right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-button:hover {
      color: #34495e;
    }

    .review-header h1 {
      font-size: 1.75rem;
      color: #2c3e50;
      margin: 0;
    }

    .movie-info {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .movie-poster {
      width: 120px;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
    }

    .movie-details h2 {
      font-size: 1.5rem;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .movie-meta {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .review-form {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .rating-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .rating-section label {
      display: block;
      margin-bottom: 1rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .rating-text {
      margin-top: 0.5rem;
      color: #7f8c8d;
    }

    .content-section {
      margin-bottom: 2rem;
    }

    .content-section label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 500;
    }

    textarea {
      width: 100%;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      line-height: 1.5;
      resize: vertical;
      transition: all 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52,152,219,0.1);
    }

    .char-count {
      text-align: right;
      color: #95a5a6;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .image-section {
      margin-bottom: 2rem;
    }

    .image-section label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .image-upload {
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.2s;
    }

    .image-upload.dragging {
      border-color: #3498db;
      background: rgba(52,152,219,0.05);
    }

    .upload-placeholder {
      color: #95a5a6;
    }

    .upload-placeholder i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .upload-placeholder button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-placeholder button:hover:not(:disabled) {
      background: #e9ecef;
      border-color: #cbd5e0;
    }

    .file-preview {
      position: relative;
    }

    .file-preview img {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: 8px;
    }

    .remove-image {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .remove-image:hover {
      background: rgba(0,0,0,0.7);
    }

    .error-message {
      margin: 1rem 0;
      padding: 1rem;
      background: #fef2f2;
      border-radius: 8px;
      color: #dc2626;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .cancel-button, .submit-button {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .cancel-button {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      color: #2c3e50;
    }

    .cancel-button:hover:not(:disabled) {
      background: #e9ecef;
    }

    .submit-button {
      background: #2ecc71;
      border: none;
      color: white;
    }

    .submit-button:hover:not(:disabled) {
      background: #27ae60;
      transform: translateY(-1px);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .fa-spinner {
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class WriteReviewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);
  protected auth = inject(Auth);

  movie: Movie | null = null;
  isLoading = true;
  error = '';
  review = { rating: 0, content: '', imageUrl: '' };
  imageFile: File | null = null;
  previewUrl = '';
  isDragging = false;
  isSubmitting = false;
  hasReviewed = false;
  protected maxContentLength = 500;

  ngOnInit() {
    const movieId = this.route.snapshot.paramMap.get('id');
    if (movieId) {
      this.loadMovie(movieId);
    } else {
      this.navigateBack();
    }
  }

  private async loadMovie(id: string) {
    try {
      this.isLoading = true;
      this.movie = await this.movieService.getMovieById(id);
      
      if (!this.movie) {
        this.error = 'No se encontró la película';
        return;
      }

      if (this.auth.isLogged()) {
        await this.checkExistingReview();
      }
    } catch (err) {
      console.error('[WriteReview] Error loading movie:', err);
      this.error = 'Error al cargar los detalles de la película';
    } finally {
      this.isLoading = false;
    }
  }

  private async checkExistingReview() {
    if (!this.movie || !this.auth.isLogged()) return;
    
    try {
      const user = this.auth.getUserLogged();
      if (!user) return;

      const reviews = await this.movieService.getReviews(this.movie.id);
      this.hasReviewed = reviews.some(r => r.userId === user.username);
    } catch (err) {
      console.error('[WriteReview] Error checking existing review:', err);
    }
  }

  protected navigateToLogin() {
    this.router.navigate(['/login']);
  }

  protected navigateBack() {
    if (this.movie) {
      this.router.navigate(['/movie', this.movie.id]);
    } else {
      this.router.navigate(['/catalog']);
    }
  }

  get isValid() {
    return this.review.rating > 0 && 
           this.review.content.trim().length > 0 &&
           this.review.content.length <= this.maxContentLength;
  }

  getRatingText(): string {
    switch (this.review.rating) {
      case 1: return 'Muy mala';
      case 2: return 'Mala';
      case 3: return 'Regular';
      case 4: return 'Buena';
      case 5: return '¡Excelente!';
      default: return 'Sin calificar';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length) this.handleFile(files[0]);
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    this.error = '';
    
    if (!file.type.startsWith('image/')) {
      this.error = 'Por favor selecciona un archivo de imagen válido';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'La imagen no debe superar los 5MB';
      return;
    }
    
    this.imageFile = file;
    this.createPreview(file);
  }

  private createPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageFile = null;
    this.previewUrl = '';
  }

  async submitReview() {
    if (!this.movie || this.isSubmitting || !this.isValid) {
      console.log('[WriteReview] Validación inicial fallida:', {
        movie: !!this.movie,
        isSubmitting: this.isSubmitting,
        isValid: this.isValid
      });
      return;
    }

    this.error = '';
    this.isSubmitting = true;

    try {
      const user = this.auth.getUserLogged();
      if (!user?.username) {
        this.error = 'Debes iniciar sesión para agregar una reseña';
        return;
      }

      // Validaciones adicionales
      if (this.review.rating === 0) {
        this.error = 'Debes seleccionar una calificación';
        return;
      }

      if (!this.review.content.trim()) {
        this.error = 'El contenido de la reseña no puede estar vacío';
        return;
      }

      const reviewData = {
        movieId: this.movie.id,
        userId: user.username,
        userName: user.username,
        rating: this.review.rating,
        content: this.review.content.trim()
      };

      console.log('[WriteReview] Enviando reseña:', reviewData);
      const result = await this.movieService.addReview(reviewData);

      console.log('[WriteReview] Resultado de addReview:', result);

      if (!result.success) {
        this.error = result.error || 'Error al publicar la reseña';
        return;
      }

      // Esperamos un momento antes de navegar
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navegar de vuelta a la página de la película
      console.log('[WriteReview] Navegando de vuelta a la película:', this.movie.id);
      await this.router.navigate(['/movie', this.movie.id]);
      
    } catch (err) {
      console.error('[WriteReview] Error al publicar reseña:', err);
      this.error = 'Error inesperado al publicar la reseña. Por favor intenta de nuevo.';
    } finally {
      this.isSubmitting = false;
    }
  }
}