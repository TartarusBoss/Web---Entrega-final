import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user';
import { LoginResponse } from '../interfaces/login-response';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  isLogged = signal(false);

  constructor(){
    this.verifyUserLogged();
  }

  login(user: User): LoginResponse {
    
    const userStr = localStorage.getItem(user.username);
    if(userStr){
      const existing = JSON.parse(userStr) as User;
      if(existing.password === user.password){
        sessionStorage.setItem('userLogged', existing.username);
        this.verifyUserLogged();
        return { success: true, redirectTo: 'perfil' };
      }
    }
    return { success:false, message: 'Usuario o contraseña incorrectos' };
  }

  signUp(user: User): LoginResponse {
    if(localStorage.getItem(user.username)){
      return { success: false, message: 'Usuario ya existe' };
    }
    
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
    sessionStorage.setItem('userLogged', user.username);
    this.verifyUserLogged();
    return { success:true, redirectTo: 'perfil' };
  }

  logout(){
    sessionStorage.removeItem('userLogged');
    this.verifyUserLogged();
  }

  verifyUserLogged(){
    this.isLogged.set(!!sessionStorage.getItem('userLogged'));
  }

  getUserLogged(){
    const username = sessionStorage.getItem('userLogged');
    if(username){
      return { username };
    }
    return { username: '' };
  }

}
