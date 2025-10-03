import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../shared/services/auth';
import { UserService } from '../../shared/services/user-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil {
  fb = inject(FormBuilder);
  auth = inject(Auth);
  userService = inject(UserService);

  username = this.auth.getUserLogged().username;
  userSignal = this.userService.getUser(this.username);

  profileForm = this.fb.group({
    email: ['', [Validators.email]],
    bio: [''],
    password: ['', [Validators.minLength(4)]],
    newPassword: ['', [Validators.minLength(4)]],
  });

  ngOnInit() {
    const user = this.userSignal();
    if (user) {
      this.profileForm.patchValue({
        email: user.email,
        bio: user.bio
      });
    }
  }

  onSaveProfile() {
    const { email, bio } = this.profileForm.value;

    try {
      this.userService.updateUserProfile(this.username, {
        email: email || '',
        bio: bio || ''
      });
      Swal.fire('✅ Perfil actualizado correctamente');
    } catch (e) {
      Swal.fire('❌ Error al actualizar el perfil');
    }
  }

  onChangePassword() {
    const { password, newPassword } = this.profileForm.value;
    const user = this.userSignal();

    if (!password || !newPassword) {
      Swal.fire('⚠️ Debes ingresar la contraseña actual y la nueva');
      return;
    }
    if (user && user.password !== password) {
      Swal.fire('❌ La contraseña actual no es correcta');
      return;
    }

    try {
      this.userService.updateUserProfile(this.username, { password: newPassword! });
      Swal.fire('🔑 Contraseña cambiada con éxito');
      this.profileForm.patchValue({ password: '', newPassword: '' });
    } catch (e) {
      Swal.fire('❌ No se pudo cambiar la contraseña');
    }
  }

  onUploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.userService
      .saveAvatarFromFile(this.username, file)
      .then(() => Swal.fire('🖼️ Avatar actualizado correctamente'))
      .catch(err => console.error(err));
  }
}
