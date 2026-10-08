import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export interface CreateAuditLogDto {
    actorId?: string;
    actorType?: 'USER' | 'SYSTEM' | 'WEBHOOK' | 'WORKER';
    action: string;
    entity: string;
    entityId: string;
    previousState?: unknown;
    newState?: unknown;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    orderId?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(dto: CreateAuditLogDto): Promise<{
        id: string;
        createdAt: Date;
        orderId: string | null;
        actorType: string;
        action: string;
        entity: string;
        entityId: string;
        previousState: Prisma.JsonValue | null;
        newState: Prisma.JsonValue | null;
        reason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        actorId: string | null;
    } | undefined>;
    findByEntity(entity: string, entityId: string): Promise<({
        actor: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        orderId: string | null;
        actorType: string;
        action: string;
        entity: string;
        entityId: string;
        previousState: Prisma.JsonValue | null;
        newState: Prisma.JsonValue | null;
        reason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        actorId: string | null;
    })[]>;
    findByOrder(orderId: string): Promise<({
        actor: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        orderId: string | null;
        actorType: string;
        action: string;
        entity: string;
        entityId: string;
        previousState: Prisma.JsonValue | null;
        newState: Prisma.JsonValue | null;
        reason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        actorId: string | null;
    })[]>;
}
