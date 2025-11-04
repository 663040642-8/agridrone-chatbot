import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
@Component({
  selector: 'app-register',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  loading = signal<boolean>(false);
  submitted = false;
  serverError: string | null = null;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  },
    { validators: this.passwordMatchValidator }
  );

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  async register() {
    this.submitted = true;
    this.serverError = null;

    if (this.registerForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.registerForm.value;

    try {
      const { data, error } = await this.authService.signUp(email!, password!);
      if (error) {
        if (error.message.includes('already registered')) {
          this.email?.setErrors({ emailTaken: true });
        } else if (error.message.includes('invalid email')) {
          this.email?.setErrors({ invalid: true });
        } else {
          this.serverError = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        }
        return;
      }

      if (data?.user && !data.user.email_confirmed_at) {
        this.serverError = 'อีเมลนี้สมัครไว้แล้ว โปรดยืนยันอีเมลของคุณ';
        return;
      }

      this.router.navigate(['/verify']);
    } catch (error) {
      console.error(error);
      this.serverError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    } finally {
      this.loading.set(false);
    }
  }
}
