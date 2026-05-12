/**
 * Audit Log Service
 * 
 * Records every data change in the AuditLog table.
 * Called from service layers after any create/update/delete operation.
 */

import { prisma } from '@/lib/prisma';

export class AuditService {
  /**
   * Write an audit log entry.
   * This should be called after every data mutation.
   */
  static async log(
    tenantId: string,
    userId: string | null,
    entity: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    oldValues?: any,
    newValues?: any,
    options?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          entity,
          entityId,
          action,
          oldValues: oldValues ?? undefined,
          newValues: newValues ?? undefined,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
        },
      });
    } catch (error) {
      // Audit logging should never crash the main operation
      console.error('[Audit Log Error]', error);
    }
  }

  /**
   * Get audit history for a specific entity.
   */
  static async getHistory(
    tenantId: string,
    entity: string,
    entityId: string,
    limit = 50,
  ) {
    return prisma.auditLog.findMany({
      where: { tenantId, entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });
  }
}
