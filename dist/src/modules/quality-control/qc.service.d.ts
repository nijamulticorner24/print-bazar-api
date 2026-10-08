import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobCardEngineService } from '../job-cards/job-card-engine.service';
import { QCInspectionType, DefectCategory, Prisma } from '@prisma/client';
export interface QCCheckItem {
    code: string;
    name: string;
    result: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
    notes?: string;
}
export interface SubmitQCDto {
    orderId: string;
    jobCardId?: string;
    type: QCInspectionType;
    items: QCCheckItem[];
    defects?: DefectCategory[];
    generalNotes?: string;
}
import { WorkflowStateService } from '../workflow/workflow-state.service';
export declare class QualityControlService {
    private readonly prisma;
    private readonly auditService;
    private readonly eventEmitter;
    private readonly jobCardEngine;
    private readonly workflowState;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, eventEmitter: EventEmitter2, jobCardEngine: JobCardEngineService, workflowState: WorkflowStateService);
    submitInspection(dto: SubmitQCDto, inspectorId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.QCInspectionType;
        notes: string | null;
        items: Prisma.JsonValue;
        orderId: string;
        jobCardId: string | null;
        outcome: import(".prisma/client").$Enums.QCOutcome;
        inspectorId: string;
        defects: import(".prisma/client").$Enums.DefectCategory[];
    }>;
    getChecklistsForOrder(orderId: string): Promise<({
        inspector: {
            id: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.QCInspectionType;
        notes: string | null;
        items: Prisma.JsonValue;
        orderId: string;
        jobCardId: string | null;
        outcome: import(".prisma/client").$Enums.QCOutcome;
        inspectorId: string;
        defects: import(".prisma/client").$Enums.DefectCategory[];
    })[]>;
    getFinalQCQueue(search?: string): Promise<({
        customer: {
            phone: string;
            id: string;
            email: string;
            fullName: string;
        };
        jobCards: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobCardStatus;
            priority: import(".prisma/client").$Enums.Priority;
            dueAt: Date;
            orderId: string;
            jobNumber: string;
            orderItemId: string;
            approvedArtworkVersionId: string | null;
            preHoldStatus: import(".prisma/client").$Enums.JobCardStatus | null;
            currentStation: string;
            machineId: string | null;
            operatorId: string | null;
            operationSequence: Prisma.JsonValue;
            technicalSpecs: Prisma.JsonValue;
            startedAt: Date | null;
            completedAt: Date | null;
        }[];
        items: ({
            artworkVersions: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.ArtworkStatus;
                customerNotes: string | null;
                orderItemId: string;
                versionNumber: number;
                storageKey: string;
                originalFileName: string;
                mimeType: string;
                fileSize: number;
                checksum: string;
                resolutionDpi: number | null;
                widthMm: Prisma.Decimal | null;
                heightMm: Prisma.Decimal | null;
                widthPixels: number | null;
                heightPixels: number | null;
                actualMegapixels: number | null;
                qualityStatus: string | null;
                warningAccepted: boolean;
                hasBleed: boolean | null;
                colorProfile: string | null;
                proofUrl: string | null;
                isApproved: boolean;
                prepressNotes: string | null;
                uploadedBy: string;
                approvedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            productId: string;
            orderId: string;
            approvedArtworkVersionId: string | null;
            productName: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            specifications: Prisma.JsonValue;
            designNotes: string | null;
        })[];
        qcChecklists: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.QCInspectionType;
            notes: string | null;
            items: Prisma.JsonValue;
            orderId: string;
            jobCardId: string | null;
            outcome: import(".prisma/client").$Enums.QCOutcome;
            inspectorId: string;
            defects: import(".prisma/client").$Enums.DefectCategory[];
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        customerId: string;
        sourceChannel: import(".prisma/client").$Enums.OrderChannel;
        customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
        deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        shippingAmount: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        balanceAmount: Prisma.Decimal;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        priority: import(".prisma/client").$Enums.Priority;
        slaStatus: import(".prisma/client").$Enums.SlaStatus;
        dueAt: Date | null;
        customerNotes: string | null;
        internalNotes: string | null;
        shippingAddressId: string | null;
        billingAddressId: string | null;
    })[]>;
    getFinalQCTemplate(): QCCheckItem[];
}
