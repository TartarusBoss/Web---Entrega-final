import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MovieService } from '../../shared/services/movie.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-pelicula',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="agregar-container">
      <h2>➕ Agregar película</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <label>Título</label>
        <input formControlName="title" />

        <label>Descripción</label>
        <textarea formControlName="description"></textarea>

        <label>Año de lanzamiento</label>
        <input formControlName="releaseDate" type="date" />

        <label>Categorías (separadas por coma)</label>
        <input formControlName="categories" placeholder="Acción,Drama,..." />

        <label>Director</label>
        <input formControlName="director" />

        <label>Duración</label>
        <input formControlName="duration" />

        <label>Póster</label>
        <input type="file" (change)="onFile($event)" accept="image/*" />

        <button type="submit">Guardar película</button>
      </form>
    </section>
  `,
  styles: [`
    .agregar-container { max-width:700px; margin:2rem auto; padding:1rem; }
    form { display:flex; flex-direction:column; gap:0.5rem; }
    input, textarea { padding:0.5rem; border:1px solid #ccc; border-radius:4px; }
    button { margin-top:1rem; padding:0.75rem; background:#3498db; color:white; border:none; border-radius:6px; }
  `]
})
export class AgregarPelicula {
  fb = inject(FormBuilder);
  router = inject(Router);
  movieService = inject(MovieService);

  file: File | null = null;

  form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    releaseDate: [''],
    categories: [''],
    director: [''],
    duration: ['']
  });

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    this.file = input.files?.[0] || null;
  }

  async onSubmit() {
    if (this.form.invalid) {
      Swal.fire('⚠️ Completa el título');
      return;
    }

    const values = this.form.value;
    const movie: any = {
      title: values.title as string,
      description: values.description as string,
      releaseDate: values.releaseDate ? new Date(values.releaseDate) : undefined,
      categories: values.categories ? (values.categories as string).split(',').map((s:string)=>s.trim()) : [],
      director: values.director as string,
      duration: values.duration as string
    };

    try {
      await this.movieService.addMovie(movie, this.file || undefined);
      Swal.fire('✅ Película creada');
      this.router.navigate(['/catalog']);
    } catch (err:any) {
      console.error(err);
      Swal.fire('❌ No se pudo crear la película');
    }
  }
}
