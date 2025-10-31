import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../star-rating/star-rating';
import { MovieService } from '../../services/movie.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  template: `
  <div class="rf-card">
    <div class="rf-header">
      <app-star-rating [(rating)]="rating" [readonly]="false" [size]="'large'"></app-star-rating>
      <span class="rf-rating-text">{{ ratingText }}</span>
    </div>

    <textarea [(ngModel)]="content" rows="4" [maxlength]="maxLen" placeholder="Escribe tu reseña..." [disabled]="busy"></textarea>
    <div class="rf-count">{{ content.length }}/{{ maxLen }}</div>

    <div class="rf-chips">
      <div class="rf-chip-group">
        <label>Pros</label>
        <div class="chips">
          @for (p of pros; track p) {
            <span class="chip">
              {{ p }}
              <button type="button" (click)="removePros(p)" [disabled]="busy">×</button>
            </span>
          }
          <input type="text" [(ngModel)]="prosInput" (keydown.enter)="addPros(); $event.preventDefault()" placeholder="Añadir..." [disabled]="busy" />
        </div>
      </div>
      <div class="rf-chip-group">
        <label>Contras</label>
        <div class="chips">
          @for (c of cons; track c) {
            <span class="chip neg">
              {{ c }}
              <button type="button" (click)="removeCons(c)" [disabled]="busy">×</button>
            </span>
          }
          <input type="text" [(ngModel)]="consInput" (keydown.enter)="addCons(); $event.preventDefault()" placeholder="Añadir..." [disabled]="busy" />
        </div>
      </div>
    </div>

    <div class="rf-row">
      <label class="switch">
        <input type="checkbox" [(ngModel)]="containsSpoilers" [disabled]="busy" />
        <span>Contiene spoilers</span>
      </label>

      <label class="switch">
        <input type="checkbox" [(ngModel)]="recommended" [disabled]="busy" />
        <span>Recomendaría</span>
      </label>
    </div>

    <div class="rf-upload" [class.dragging]="dragging" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
      <input type="file" #fileInput accept="image/*" (change)="onFileChange($event)" [disabled]="busy" style="display: none" />
      @if (!imagePreview) {
        <button type="button" (click)="fileInput.click()" [disabled]="busy"><i class="fas fa-camera"></i> Añadir imagen</button>
      } @else {
        <div class="rf-preview">
          <img [src]="imagePreview" alt="vista previa" />
          <button type="button" (click)="clearImage()" [disabled]="busy">Quitar</button>
        </div>
      }
    </div>

    @if (error) {
      <div class="rf-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</div>
    }

    <div class="rf-actions">
      <button type="button" class="ghost" (click)="cancel.emit()" [disabled]="busy">Cancelar</button>
      <button type="button" class="primary" (click)="onSubmit()" [disabled]="!valid || busy">
        @if (!busy) {
          {{ reviewId ? 'Actualizar' : 'Publicar' }} reseña
        } @else {
          <i class="fas fa-spinner fa-spin"></i> Guardando...
        }
      </button>
    </div>
  </div>
  `,
  styles: [`
  .rf-card { background:#fff; border-radius:12px; padding:1rem; box-shadow:0 2px 6px rgba(0,0,0,.08); }
  .rf-header { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
  .rf-rating-text { color:#7f8c8d; }
  textarea { width:100%; border:1px solid #e0e0e0; border-radius:8px; padding:.75rem; }
  .rf-count { text-align:right; color:#95a5a6; font-size:.85rem; margin-top:.25rem; }
  .rf-chips { display:grid; gap:.75rem; grid-template-columns:1fr 1fr; margin:.75rem 0; }
  .rf-chip-group label { display:block; color:#2c3e50; font-weight:500; margin-bottom:.25rem; }
  .chips { display:flex; flex-wrap:wrap; gap:.5rem; background:#f8f9fa; padding:.5rem; border-radius:8px; }
  .chip { background:#eafaf1; color:#1e824c; padding:.25rem .5rem; border-radius:12px; display:inline-flex; align-items:center; gap:.35rem; }
  .chip.neg { background:#fdecea; color:#c0392b; }
  .chip button { border:none; background:transparent; cursor:pointer; }
  .chips input { border:none; background:transparent; outline:none; min-width:100px; }
  .rf-row { display:flex; gap:1.5rem; align-items:center; margin:.5rem 0 1rem; }
  .switch { display:flex; gap:.5rem; align-items:center; color:#2c3e50; }
  .rf-upload { border:1px dashed #e0e0e0; border-radius:8px; padding:.75rem; text-align:center; }
  .rf-upload.dragging { background:rgba(52,152,219,.06); border-color:#3498db; }
  .rf-upload button { border:1px solid #e0e0e0; background:#f8f9fa; padding:.5rem .75rem; border-radius:6px; cursor:pointer; }
  .rf-preview { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
  .rf-preview img { max-height:160px; border-radius:8px; object-fit:contain; width:100%; }
  .rf-error { margin-top:.75rem; color:#dc2626; background:#fef2f2; border-radius:8px; padding:.5rem .75rem; }
  .rf-actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top:.75rem; }
  .rf-actions .ghost { background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; padding:.5rem 1rem; }
  .rf-actions .primary { background:#2ecc71; color:#fff; border:none; border-radius:8px; padding:.5rem 1rem; }
  `]
})
export class ReviewFormComponent {
  @Input() movieId!: string;
  @Input() reviewId?: string;
  @Input() initial?: Partial<{ rating: number; content: string; pros: string[]; cons: string[]; containsSpoilers: boolean; recommended: boolean; imageUrl?: string }>;
  @Output() cancel = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  protected auth = inject(Auth);
  private movieService = inject(MovieService);

  rating = 0;
  content = '';
  pros: string[] = [];
  cons: string[] = [];
  containsSpoilers = false;
  recommended = true;
  imageFile: File | null = null;
  imagePreview = '';
  error = '';
  busy = false;
  maxLen = 800;

  prosInput = '';
  consInput = '';
  dragging = false;

  ngOnInit() {
    if (this.initial) {
      this.rating = this.initial.rating ?? 0;
      this.content = this.initial.content ?? '';
      this.pros = [...(this.initial.pros || [])];
      this.cons = [...(this.initial.cons || [])];
      this.containsSpoilers = !!this.initial.containsSpoilers;
      this.recommended = this.initial.recommended !== false;
      this.imagePreview = this.initial.imageUrl || '';
    }
  }

  get ratingText() {
    return this.rating ? `${this.rating}/5` : 'Sin calificar';
    }

  get valid() {
    return this.rating > 0 && this.content.trim().length > 0 && this.content.length <= this.maxLen;
  }

  addPros() { const v = this.prosInput.trim(); if (!v) return; this.pros.push(v); this.prosInput = ''; }
  removePros(v: string) { this.pros = this.pros.filter(x => x !== v); }
  addCons() { const v = this.consInput.trim(); if (!v) return; this.cons.push(v); this.consInput = ''; }
  removeCons(v: string) { this.cons = this.cons.filter(x => x !== v); }

  onFileChange(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.setFile(f); }
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragging = false; }
  onDrop(e: DragEvent) { e.preventDefault(); this.dragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.setFile(f); }

  private setFile(file: File) {
    this.error = '';
    if (!file.type.startsWith('image/')) { this.error = 'Selecciona una imagen válida'; return; }
    if (file.size > 5 * 1024 * 1024) { this.error = 'Máximo 5MB'; return; }
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = String(reader.result);
    reader.readAsDataURL(file);
  }
  clearImage() { this.imageFile = null; this.imagePreview = ''; }

  async onSubmit() {
    if (!this.valid || this.busy) return;
    const user = this.auth.getUserLogged();
    if (!user?.username) { this.error = 'Inicia sesión'; return; }

    this.busy = true; this.error = '';
    try {
      if (this.reviewId) {
        const res = await this.movieService.updateReview(this.reviewId, {
          rating: this.rating,
          content: this.content.trim(),
          pros: this.pros,
          cons: this.cons,
          containsSpoilers: this.containsSpoilers,
          recommended: this.recommended,
          imageFile: this.imageFile || undefined
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await this.movieService.addReview({
          movieId: this.movieId,
          userId: user.username,
          userName: user.username,
          rating: this.rating,
          content: this.content.trim(),
          pros: this.pros,
          cons: this.cons,
          containsSpoilers: this.containsSpoilers,
          recommended: this.recommended,
          imageFile: this.imageFile || undefined
        });
        if (!res.success) throw new Error(res.error);
      }
      this.success.emit();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo guardar la reseña';
    } finally {
      this.busy = false;
    }
  }
}