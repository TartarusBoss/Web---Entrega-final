import { Component, inject, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../shared/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header>
      <div class="container">
        <h1>🎬 MovieRate</h1>
        <nav>
          @if (isLoggedSignal()) {
            <a routerLink="/catalog">Catálogo</a>
            <a routerLink="/ranking">Ranking</a>
            <a routerLink="/perfil">Mi perfil</a>
            <a href="#" (click)="onLogout($event)">Cerrar sesión</a>
          } @else {
            <a routerLink="/">Iniciar sesión</a>
            <a routerLink="/sign-up">Registrarse</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [`
    header {
      background: #222;
      color: #fff;
      padding: 12px 0;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
    }
    nav a {
      margin: 0 10px;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
    }
    nav a:hover {
      text-decoration: underline;
    }
  `]
})
export class Header {
  private router = inject(Router);
  private auth = inject(Auth);
  private effectRef: ReturnType<typeof effect>;

  isLoggedSignal = this.auth.isLogged;

  constructor() {
    // Crear un effect que se asegure de detectar los cambios correctamente
    this.effectRef = effect(() => {
      console.log('[Header] Auth state changed:', this.isLoggedSignal());
    });
  }

  ngOnInit() {
    // Asegurarse de que el router sepa que debe esperar la autenticación
    this.router.events.subscribe(() => {
      console.log('[Header] Navigation event, auth state:', this.isLoggedSignal());
    });
  }

  onLogout(event: Event) {
    event.preventDefault();
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
