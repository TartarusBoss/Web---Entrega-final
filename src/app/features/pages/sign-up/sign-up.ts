import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../shared/services/auth';
import { User } from '../../shared/interfaces/user';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(Auth);

  signUpForm = this.fb.group({
    username:['', [Validators.required, Validators.minLength(3)]],
    email:['', [Validators.required, Validators.email]],
    password:['', [Validators.required, Validators.minLength(4)]],
    rePassword:['', [Validators.required]]
  });

  onSignUp(){
    if(!this.signUpForm.valid){
      Swal.fire('Faltan campos por diligenciar');
      return;
    }
    const { password, rePassword } = this.signUpForm.value;
    if(password !== rePassword){
      Swal.fire('Las contraseñas no coinciden');
      return;
    }

    const user = {
      username: this.signUpForm.value.username,
      password: this.signUpForm.value.password,
      email: this.signUpForm.value.email,
      bio: '',
      avatarUrl: '',
      createdAt: new Date().toISOString()
    } as User;

    const resp = this.authService.signUp(user);
    if(resp.success){
      Swal.fire('Usuario creado');
      this.router.navigate([resp.redirectTo || 'perfil']);
      return;
    }
    Swal.fire('Error', resp.message || 'No se pudo crear el usuario','error');
  }
}
