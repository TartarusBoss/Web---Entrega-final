import { Routes } from '@angular/router';
import { Login } from './features/pages/login/login';
import { SignUp } from './features/pages/sign-up/sign-up';
import { Perfil } from './features/pages/perfil/perfil';
import { CatalogComponent } from './features/pages/catalog/catalog';
import { RankingComponent } from './features/pages/ranking/ranking';
import { AgregarPelicula } from './features/pages/agregar-pelicula/agregar-pelicula';
import { MovieDetailsComponent } from './features/pages/movie-details/movie-details';
import { authGuard } from './features/shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'sign-up', component: SignUp },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'catalog', component: CatalogComponent, canActivate: [authGuard] },
  { path: 'agregar-pelicula', component: AgregarPelicula, canActivate: [authGuard] },
  { path: 'ranking', component: RankingComponent, canActivate: [authGuard] },
  { path: 'movie/:id', component: MovieDetailsComponent },
  // Ruta legacy de escribir reseña eliminada: ahora el formulario es inline en MovieDetails
  { path: '**', redirectTo: '' }
];
