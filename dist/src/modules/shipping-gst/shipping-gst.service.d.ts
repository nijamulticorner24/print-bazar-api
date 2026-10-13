import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateShippingGstSettingsDto, CreateShippingZoneDto, UpdateShippingZoneDto } from './dto/shipping-gst.dto';
export interface ShippingGstSettingsRecord {
    id: string;
    baseShippingFee: number;
    gstRate: number;
    freeShippingThreshold: number;
    isFreeShippingEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ShippingZoneRecord {
    id: string;
    zoneName: string;
    pincodePrefix: string;
    shippingCharge: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ShippingTaxCalculationResult {
    subtotal: number;
    shippingFee: number;
    baseShippingFee: number;
    isFreeShippingApplied: boolean;
    freeShippingThreshold: number;
    isFreeShippingEnabled: boolean;
    matchedZone: {
        id: string;
        zoneName: string;
        pincodePrefix: string;
        shippingCharge: number;
    } | null;
    gstRatePercent: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    deliveryMethod: string;
    grandTotal: number;
}
export declare class ShippingGstService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private static readonly SETTING_ID;
    constructor(prisma: PrismaService, auditService: AuditService);
    getSettings(): Promise<ShippingGstSettingsRecord>;
    updateSettings(dto: UpdateShippingGstSettingsDto, actorId?: string): Promise<ShippingGstSettingsRecord>;
    listZones(): Promise<ShippingZoneRecord[]>;
    createZone(dto: CreateShippingZoneDto, actorId?: string): Promise<ShippingZoneRecord>;
    updateZone(id: string, dto: UpdateShippingZoneDto, actorId?: string): Promise<ShippingZoneRecord>;
    deleteZone(id: string, actorId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateShippingAndTax(subtotal: number, postalCode?: string, deliveryMethod?: 'COURIER' | 'STORE_PICKUP', isInterState?: boolean): Promise<ShippingTaxCalculationResult>;
}
