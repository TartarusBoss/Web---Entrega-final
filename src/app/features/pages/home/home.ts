import { Injectable, signal } from '@angular/core';
import { User } from '../../shared/interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userSignal = signal<User | null>(null);

  getUser(username: string) {
    const userStr = localStorage.getItem(username);
    if (!userStr) {
      this.userSignal.set(null);
      return this.userSignal;
    }
    try {
      const u = JSON.parse(userStr) as User;
      this.userSignal.set(u);
      return this.userSignal;
    } catch (e) {
      console.error('Error parseando usuario desde localStorage', e);
      this.userSignal.set(null);
      return this.userSignal;
    }
  }

  updateUserProfile(username: string, patch: Partial<User>) {
    const userStr = localStorage.getItem(username);
    if (!userStr) {
      throw new Error('User not found');
    }
    const user = JSON.parse(userStr) as User;
    const updated: User = {
      ...user,
      ...patch
    };
    localStorage.setItem(username, JSON.stringify(updated));
    this.userSignal.set(updated);
    return updated;
  }

  saveAvatarFromFile(username: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        try {
          
          this.updateUserProfile(username, { avatarUrl: dataUrl });
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
