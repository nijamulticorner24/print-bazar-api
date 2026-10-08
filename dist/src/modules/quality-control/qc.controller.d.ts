import { QualityControlService, SubmitQCDto } from './qc.service';
import { JwtPayload } from '../../common/types/roles';
export declare class QualityControlController {
    private readonly qcService;
    constructor(qcService: QualityControlService);
    getFinalQCTemplate(): import("./qc.service").QCCheckItem[];
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
        items: import("@prisma/client/runtime/library").JsonValue;
        orderId: string;
        jobCardId: string | null;
        outcome: import(".prisma/client").$Enums.QCOutcome;
        inspectorId: string;
        defects: import(".prisma/client").$Enums.DefectCategory[];
    })[]>;
    getFinalQCQueue(): Promise<({
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
            operationSequence: import("@prisma/client/runtime/library").JsonValue;
            technicalSpecs: import("@prisma/client/runtime/library").JsonValue;
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
                widthMm: import("@prisma/client/runtime/library").Decimal | null;
                heightMm: import("@prisma/client/runtime/library").Decimal | null;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            specifications: import("@prisma/client/runtime/library").JsonValue;
            designNotes: string | null;
        })[];
        qcChecklists: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.QCInspectionType;
            notes: string | null;
            items: import("@prisma/client/runtime/library").JsonValue;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAmount: import("@prisma/client/runtime/library").Decimal;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        balanceAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        priority: import(".prisma/client").$Enums.Priority;
        slaStatus: import(".prisma/client").$Enums.SlaStatus;
        dueAt: Date | null;
        customerNotes: string | null;
        internalNotes: string | null;
        shippingAddressId: string | null;
        billingAddressId: string | null;
    })[]>;
    submitInspection(body: SubmitQCDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.QCInspectionType;
        notes: string | null;
        items: import("@prisma/client/runtime/library").JsonValue;
        orderId: string;
        jobCardId: string | null;
        outcome: import(".prisma/client").$Enums.QCOutcome;
        inspectorId: string;
        defects: import(".prisma/client").$Enums.DefectCategory[];
    }>;
}
