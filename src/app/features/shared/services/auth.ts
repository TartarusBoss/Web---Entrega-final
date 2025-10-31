import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user';
import { LoginResponse } from '../interfaces/login-response';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly SESSION_KEY = 'userLogged';
  isLogged = signal(false);

  constructor(private router: Router) {
    console.log('[Auth] initializing...');
    this.verifyUserLogged();
    
    // Verificar estado de sesión al inicio y cada vez que haya cambios en storage
    window.addEventListener('storage', () => this.verifyUserLogged());
  }

  login(user: User): LoginResponse {
    console.log('[Auth] login attempt for:', user.username);
    const userStr = localStorage.getItem(user.username);
    
    if (userStr) {
      const existing = JSON.parse(userStr) as User;
      if (existing.password === user.password) {
        try {
          localStorage.setItem(this.SESSION_KEY, existing.username);
          sessionStorage.setItem(this.SESSION_KEY, existing.username);
          this.verifyUserLogged();
          console.log('[Auth] login success for:', existing.username);
          return { success: true, redirectTo: 'catalog' };
        } catch (err) {
          console.error('[Auth] Storage error:', err);
          return { success: false, message: 'Error al iniciar sesión' };
        }
      }
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  }

  signUp(user: User): LoginResponse {
    console.log('[Auth] signup attempt for:', user.username);
    if (localStorage.getItem(user.username)) {
      return { success: false, message: 'Usuario ya existe' };
    }
    
    try {
      const now = new Date().toISOString();
      const userToSave: User = {
        username: user.username,
        password: user.password,
        email: user.email || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        createdAt: now,
        gallery: []
      };
      
      localStorage.setItem(user.username, JSON.stringify(userToSave));
      localStorage.setItem(this.SESSION_KEY, user.username);
      sessionStorage.setItem(this.SESSION_KEY, user.username);
      this.verifyUserLogged();
      console.log('[Auth] signUp success for:', user.username);
      return { success: true, redirectTo: 'catalog' };
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      return { success: false, message: 'Error al crear usuario' };
    }
  }

  logout(): void {
    console.log('[Auth] logout called');
    try {
      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      this.verifyUserLogged();
      this.router.navigate(['/']);
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    }
  }

  verifyUserLogged(): void {
    try {
      const sessionUser = sessionStorage.getItem(this.SESSION_KEY);
      const localUser = localStorage.getItem(this.SESSION_KEY);
      const isValid = !!sessionUser && !!localUser && sessionUser === localUser;
      console.log('[Auth] verifyUserLogged =>', isValid, 'user:', sessionUser);
      
      if (!isValid && this.isLogged()) {
        // Session is invalid but we thought we were logged in
        this.logout();
        return;
      }
      
      this.isLogged.set(isValid);
    } catch (err) {
      console.error('[Auth] Verify error:', err);
      this.isLogged.set(false);
    }
  }

  getUserLogged(): { username: string } {
    try {
      const username = sessionStorage.getItem(this.SESSION_KEY);
      return username ? { username } : { username: '' };
    } catch (err) {
      console.error('[Auth] GetUser error:', err);
      return { username: '' };
    }
  }
}