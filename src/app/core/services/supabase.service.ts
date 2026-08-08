import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseClient: SupabaseClient | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const url = environment.supabaseUrl;
    const key = environment.supabaseKey;

    if (url && key && !url.includes('YOUR_SUPABASE_PROJECT_ID') && !key.includes('YOUR_SUPABASE_ANON_KEY')) {
      try {
        this.supabaseClient = createClient(url, key);
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
      }
    } else {
      console.info('Supabase URL or Anon Key is not yet configured in src/environments/environment.ts');
    }
  }

  get client(): SupabaseClient | null {
    if (!this.supabaseClient) {
      this.initClient();
    }
    return this.supabaseClient;
  }

  get isConfigured(): boolean {
    const url = environment.supabaseUrl;
    const key = environment.supabaseKey;
    return !!(url && key && !url.includes('YOUR_SUPABASE_PROJECT_ID') && !key.includes('YOUR_SUPABASE_ANON_KEY'));
  }
}
