import { db } from '@/lib/db';
import { createServiceRoleClient } from '../supabase/service-role';

export class SuperAdminService {
  static async getStores() {
    const { data: stores, error } = await db()
      .from('Tenant')
      .select('*')
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return stores || [];
  }

  static async getStoreById(id: string) {
    const { data: store, error } = await db()
      .from('Tenant')
      .select('*')
      .eq('id', id)
      .eq('isDeleted', false)
      .single();

    if (error) throw new Error(error.message);
    return store;
  }

  static async createStore(data: { name: string; address?: string; gstn?: string; contactNumber?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data: store, error } = await db()
      .from('Tenant')
      .insert({
        name: data.name,
        slug,
        address: data.address,
        gstn: data.gstn,
        contactNumber: data.contactNumber,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return store;
  }

  static async getUsersForStore(tenantId: string) {
    const { data: users, error } = await db()
      .from('User')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return users || [];
  }

  static async createUserForStore(tenantId: string, data: { email: string; fullName: string; password?: string; role: 'ADMIN' | 'USER' }) {
    const adminAuthClient = createServiceRoleClient();
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: data.email,
      password: data.password || 'Temporary123!',
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      }
    });

    if (authError) throw new Error(`Auth Error: ${authError.message}`);
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create the user profile in our DB
    const { data: userProfile, error: dbError } = await db()
      .from('User')
      .insert({
        tenantId,
        email: data.email,
        fullName: data.fullName,
        supabaseUid: authData.user.id,
        role: data.role,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback auth user
      await adminAuthClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`DB Error: ${dbError.message}`);
    }

    return userProfile;
  }
}
