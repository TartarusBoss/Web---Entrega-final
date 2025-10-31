import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Servicio para crear y exponer el cliente de Supabase.
 *
 * Seguridad / buenas prácticas:
 * - NO incluir en el repositorio la Service Role key (privilegiada).
 * - Para desarrollo local puedes inyectar las credenciales en runtime creando
 *   un objeto global `window.__env = { SUPABASE_URL: '...', SUPABASE_ANON_KEY: '...' }`
 *   desde `index.html` o usando variables de entorno al construir la app.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private initialized = false;

  constructor() {
    const SUPABASE_URL = 'https://uksjnuhextannefgecja.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2pudWhleHRhbm5lZmdlY2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTk5MjUsImV4cCI6MjA3NzMzNTkyNX0.5JgHDtvz4GTxHeVmQleji1pVs2d963iA-jo58MOmYSs';
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Las credenciales de Supabase no están configuradas correctamente');
    }

    try {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      });
      this.initialized = true;
    } catch (err) {
      console.error('[SupabaseService] Error initializing client:', err);
      throw new Error('No se pudo inicializar el cliente de Supabase');
    }
  }

  getClient(): SupabaseClient {
    if (!this.initialized) {
      console.error('[SupabaseService] Client not initialized');
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('movies')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('[SupabaseService] Connection test failed:', error);
        return false;
      }
      
      console.log('[SupabaseService] Connection test successful');
      return true;
    } catch (err) {
      console.error('[SupabaseService] Connection test error:', err);
      return false;
    }
  }
}