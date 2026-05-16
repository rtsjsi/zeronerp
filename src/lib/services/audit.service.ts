/**
 * Audit Log Service (Supabase SDK)
 */

import { db } from '@/lib/db';

export class AuditService {
  static async log(
    tenantId: string,
    userId: string | null,
    entity: string,
    entityId: string,
    action: 'create' | 'update' | 'delete' | 'update_status' | 'stock_move',
    oldValues?: any,
    newValues?: any,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      await db().from('AuditLog').insert({
        tenantId,
        userId,
        entity,
        entityId,
        action,
        oldValues: oldValues ?? null,
        newValues: newValues ?? null,
        ipAddress: options?.ipAddress ?? null,
        userAgent: options?.userAgent ?? null,
      });
    } catch (error) {
      console.error('[Audit Log Error]', error);
    }
  }

  static async getHistory(
    tenantId: string,
    entity: string,
    entityId: string,
    limit = 50,
  ) {
    const { data } = await db()
      .from('AuditLog')
      .select('*, user:User(fullName, email)')
      .eq('tenantId', tenantId)
      .eq('entity', entity)
      .eq('entityId', entityId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
