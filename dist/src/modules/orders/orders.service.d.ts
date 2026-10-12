import { PrismaService } from '../prisma/prisma.service';
import { PricingService, OptionSelectionDto } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, OrderChannel, DeliveryMethod, PaymentStatus, Priority, SlaStatus, Prisma } from '@prisma/client';
import { JwtPayload } from '../../common/types/roles';
export interface CreateOrderItemDto {
    productId: string;
    productName?: string;
    sku?: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    options?: OptionSelectionDto[];
    fieldValues?: Record<string, any>;
    specifications?: any;
    designNotes?: string;
    artworkUrl?: string;
    artworkStorageKey?: string;
    referenceImageUrl?: string;
    artworkFile?: {
        fileUrl: string;
        storageKey?: string;
        fileName?: string;
        originalFileName?: string;
        mimeType?: string;
        fileSize?: number;
        width?: number;
        height?: number;
        actualMegapixels?: number;
        qualityStatus?: string;
        warningAccepted?: boolean;
    };
    referenceImage?: {
        fileUrl: string;
        storageKey?: string;
        fileName?: string;
        originalFileName?: string;
        mimeType?: string;
        fileSize?: number;
    };
    selectedDesignService?: boolean;
    hasDesignService?: boolean;
}
export interface CreateOrderDto {
    customerId?: string;
    customerDetails?: {
        fullName: string;
        email: string;
        phone: string;
        companyName?: string;
        gstin?: string;
    };
    sourceChannel?: OrderChannel;
    deliveryMethod?: DeliveryMethod;
    paymentMode?: 'FULL' | 'SPLIT_50';
    paymentMethod?: string;
    paidAmount?: number;
    advanceAmount?: number;
    balanceAmount?: number;
    shippingAddress?: {
        contactName: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country?: string;
    };
    items: CreateOrderItemDto[];
    customerNotes?: string;
    priority?: Priority;
}
export interface OrderQueryFilters {
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    priority?: Priority;
    slaStatus?: SlaStatus;
    sourceChannel?: OrderChannel;
    deliveryMethod?: DeliveryMethod;
    exceptionType?: 'DELAYED' | 'ON_HOLD' | 'QC_FAIL' | 'UNPAID';
    page?: number;
    limit?: number;
}
export declare class OrdersService {
    private readonly prisma;
    private readonly pricingService;
    private readonly auditService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, pricingService: PricingService, auditService: AuditService, eventEmitter: EventEmitter2);
    createOrder(dto: CreateOrderDto, creatorUserId?: string): Promise<{
        customer: {
            phone: string;
            id: string;
            email: string;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            companyName: string | null;
            gstin: string | null;
        };
        shippingAddress: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isDefault: boolean;
            customerId: string;
            contactName: string;
            street: string;
            landmark: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
        items: {
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
    }>;
    listOrders(filters: OrderQueryFilters, currentUser?: JwtPayload): Promise<{
        data: ({
            customer: {
                phone: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
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
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
                packageNumber: string;
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
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOrderDetails(orderId: string): Promise<{
        auditLogs: ({
            actor: {
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            orderId: string | null;
            reason: string | null;
            actorType: string;
            action: string;
            entity: string;
            entityId: string;
            previousState: Prisma.JsonValue | null;
            newState: Prisma.JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            actorId: string | null;
        })[];
        customer: {
            phone: string;
            id: string;
            email: string;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            companyName: string | null;
            gstin: string | null;
        };
        shippingAddress: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isDefault: boolean;
            customerId: string;
            contactName: string;
            street: string;
            landmark: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
        billingAddress: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isDefault: boolean;
            customerId: string;
            contactName: string;
            street: string;
            landmark: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
        items: ({
            jobCards: ({
                operator: {
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                } | null;
                machine: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    code: string;
                    type: string;
                    hourlyCapacity: number;
                } | null;
                issues: {
                    id: string;
                    createdAt: Date;
                    description: string;
                    jobCardId: string;
                    reasonCode: string;
                    reportedBy: string;
                    isResolved: boolean;
                    resolvedBy: string | null;
                    resolvedAt: Date | null;
                }[];
            } & {
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
            })[];
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
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string;
            transactionId: string;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            method: import(".prisma/client").$Enums.PaymentMethod;
            amount: Prisma.Decimal;
            currency: string;
            idempotencyKey: string | null;
            capturedAt: Date | null;
            failureReason: string | null;
        }[];
        invoices: {
            id: string;
            subtotal: Prisma.Decimal;
            orderId: string;
            cgst: Prisma.Decimal;
            sgst: Prisma.Decimal;
            igst: Prisma.Decimal;
            totalTax: Prisma.Decimal;
            grandTotal: Prisma.Decimal;
            invoiceNumber: string;
            customerGstin: string | null;
            pdfUrl: string | null;
            issuedAt: Date;
        }[];
        packages: ({
            shipment: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ShipmentStatus;
                shipmentNumber: string;
                courierName: string;
                awbNumber: string;
                trackingUrl: string | null;
                labelPdfUrl: string | null;
                manifestedAt: Date | null;
                dispatchedAt: Date | null;
                deliveredAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PackageStatus;
            orderId: string;
            packageNumber: string;
            sequenceNumber: number;
            totalPackages: number;
            grossWeightGrams: number;
            lengthCm: Prisma.Decimal;
            widthCm: Prisma.Decimal;
            heightCm: Prisma.Decimal;
            labelUrl: string | null;
            barcode: string;
            shipmentId: string | null;
        })[];
        statusHistory: ({
            changedBy: {
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            department: import(".prisma/client").$Enums.Department | null;
            createdAt: Date;
            notes: string | null;
            orderId: string;
            reason: string | null;
            fromStatus: import(".prisma/client").$Enums.OrderStatus | null;
            toStatus: import(".prisma/client").$Enums.OrderStatus;
            durationMinutes: number | null;
            changedById: string | null;
        })[];
        qcChecklists: ({
            inspector: {
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
        })[];
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
    }>;
}
