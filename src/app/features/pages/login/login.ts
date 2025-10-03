import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../shared/services/auth';
import { User } from '../../shared/interfaces/user';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(Auth);

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  onLogin() {
    if (!this.loginForm.valid) {
      Swal.fire('⚠️ Faltan campos por diligenciar');
      return;
    }
    const user = this.loginForm.value as User;
    const resp = this.authService.login(user);
    if (resp.success) {
      Swal.fire('✅ Ingreso exitoso');
      this.router.navigate([resp.redirectTo || 'perfil']);
      return;
    }
    Swal.fire({
      icon: 'error',
      title: 'error...',
      text: resp.message || 'Ingreso fallido!'
    });
  }
}
