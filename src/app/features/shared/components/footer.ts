import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer>
      <p>© 2025 MovieRate - Todos los derechos reservados</p>
    </footer>
  `,
  styles: [`
    footer {
      background: #222;
      color: #fff;
      padding: 10px;
      text-align: center;
      font-size: 14px;
      margin-top: 40px;
    }
  `]
})
export class Footer {}
