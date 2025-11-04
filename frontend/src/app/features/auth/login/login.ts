import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  loading = signal<boolean>(false);
  submitted = false;
  serverError: string | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async login() {
    this.submitted = true;
    this.serverError = null;
    
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await this.authService.signIn(email!, password!);

    if (error) {
      this.serverError = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      return;
    }

      this.router.navigate(['/chat']);
    } catch (error) {
      this.serverError = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
