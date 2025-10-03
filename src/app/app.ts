import { Component, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Auth } from './features/shared/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgIf, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = new Auth(); // inyecta tu servicio Auth

  isLogged = () => this.auth.isLogged(); // función para la plantilla

  protected readonly title = signal('movie-rate-app');
}
