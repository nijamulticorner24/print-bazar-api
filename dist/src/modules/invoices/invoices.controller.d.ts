import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    getInvoice(invoiceNumber: string): Promise<{
        order: {
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
                postalCode: string;
                contactName: string;
                street: string;
                landmark: string | null;
                city: string;
                state: string;
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
                postalCode: string;
                contactName: string;
                street: string;
                landmark: string | null;
                city: string;
                state: string;
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
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                specifications: import("@prisma/client/runtime/library").JsonValue;
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
        };
    } & {
        id: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        orderId: string;
        cgst: import("@prisma/client/runtime/library").Decimal;
        sgst: import("@prisma/client/runtime/library").Decimal;
        igst: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        totalTax: import("@prisma/client/runtime/library").Decimal;
        invoiceNumber: string;
        customerGstin: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
    }>;
    getInvoicesForOrder(orderId: string): Promise<{
        id: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        orderId: string;
        cgst: import("@prisma/client/runtime/library").Decimal;
        sgst: import("@prisma/client/runtime/library").Decimal;
        igst: import("@prisma/client/runtime/library").Decimal;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        totalTax: import("@prisma/client/runtime/library").Decimal;
        invoiceNumber: string;
        customerGstin: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
    }[]>;
}
