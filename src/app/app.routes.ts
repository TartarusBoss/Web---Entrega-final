import { Routes } from '@angular/router';
import { Login } from './features/pages/login/login';
import { SignUp } from './features/pages/sign-up/sign-up';
import { Perfil } from './features/pages/perfil/perfil';

export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'sign-up', component: SignUp },
  { path: 'perfil', component: Perfil },
  { path: '**', redirectTo: '' }
];
