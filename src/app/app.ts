import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Auth } from './features/shared/services/auth';
import { Header } from './features/shared/components/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  // Use Angular DI to get the singleton Auth service
  private auth = inject(Auth);

  // optional helper if template needs it elsewhere
  isLogged = () => this.auth.isLogged();

  protected readonly title = signal('movie-rate-app');

  // Helper para mostrar info rápida en template (solo debug)
  getSessionUser() {
    return sessionStorage.getItem('userLogged') || '';
  }
}