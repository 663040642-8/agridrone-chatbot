import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase-service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  #user = signal<User | null>(null);
  loading = signal<boolean>(true);

  constructor() {
    this.initUser();
  }

  private async initUser() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.#user.set(session?.user ?? null);
    this.loading.set(false);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.#user.set(session?.user ?? null);
    });
  }

  get user() {
    return this.#user;
  }

  get userId(): string | null {
    return this.#user()?.id || null;
  }

  get isLoggedIn() {
    return !!this.#user();
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.#user.set(null);
    window.location.reload();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (!error) this.#user.set(data.user);
    return { data, error };
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email, 
      password, 
      options: {
        emailRedirectTo: 'https://agridrone-chatbot.vercel.app/chat'
      }
    });
    return { data, error };
  }
}
