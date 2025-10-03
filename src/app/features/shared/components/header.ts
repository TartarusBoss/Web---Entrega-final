import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header>
      <h1>🎬 MovieRate</h1>
      <nav>
        <a routerLink="/home">Inicio</a>
        <a routerLink="/perfil">Mi Perfil</a>
        <a routerLink="/">Cerrar sesión</a>
      </nav>
    </header>
  `,
  styles: [`
    header {
      background: #222;
      color: #fff;
      padding: 15px;
      text-align: center;
    }
    nav a {
      margin: 0 15px;
      color: #fff;
      text-decoration: none;
    }
    nav a:hover {
      text-decoration: underline;
    }
  `]
})
export class Header {}
