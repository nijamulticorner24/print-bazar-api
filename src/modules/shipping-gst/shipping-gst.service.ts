import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  UpdateShippingGstSettingsDto,
  CreateShippingZoneDto,
  UpdateShippingZoneDto,
} from './dto/shipping-gst.dto';

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

@Injectable()
export class ShippingGstService {
  private readonly logger = new Logger(ShippingGstService.name);
  private static readonly SETTING_ID = 'default';

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get current persisted settings or initialize defaults once without overwriting existing data.
   */
  async getSettings(): Promise<ShippingGstSettingsRecord> {
    let setting = await (this.prisma as any).shippingGstSetting.findUnique({
      where: { id: ShippingGstService.SETTING_ID },
    });

    if (!setting) {
      setting = await (this.prisma as any).shippingGstSetting.create({
        data: {
          id: ShippingGstService.SETTING_ID,
          baseShippingFee: 150.0,
          gstRate: 18.0,
          freeShippingThreshold: 2000.0,
          isFreeShippingEnabled: true,
        },
      });
    }

    return {
      id: setting.id,
      baseShippingFee: Number(setting.baseShippingFee),
      gstRate: Number(setting.gstRate),
      freeShippingThreshold: Number(setting.freeShippingThreshold),
      isFreeShippingEnabled: Boolean(setting.isFreeShippingEnabled),
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Update core rates and tax parameters
   */
  async updateSettings(
    dto: UpdateShippingGstSettingsDto,
    actorId?: string,
  ): Promise<ShippingGstSettingsRecord> {
    const current = await this.getSettings();

    const updated = await (this.prisma as any).shippingGstSetting.upsert({
      where: { id: ShippingGstService.SETTING_ID },
      create: {
        id: ShippingGstService.SETTING_ID,
        baseShippingFee: dto.baseShippingFee,
        gstRate: dto.gstRate,
        freeShippingThreshold: dto.freeShippingThreshold,
        isFreeShippingEnabled: dto.isFreeShippingEnabled,
      },
      update: {
        baseShippingFee: dto.baseShippingFee,
        gstRate: dto.gstRate,
        freeShippingThreshold: dto.freeShippingThreshold,
        isFreeShippingEnabled: dto.isFreeShippingEnabled,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'SHIPPING_GST_SETTINGS_UPDATED',
      entity: 'ShippingGstSetting',
      entityId: ShippingGstService.SETTING_ID,
      previousState: current,
      newState: updated,
    });

    return {
      id: updated.id,
      baseShippingFee: Number(updated.baseShippingFee),
      gstRate: Number(updated.gstRate),
      freeShippingThreshold: Number(updated.freeShippingThreshold),
      isFreeShippingEnabled: Boolean(updated.isFreeShippingEnabled),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * List all configured shipping zones
   */
  async listZones(): Promise<ShippingZoneRecord[]> {
    const zones = await (this.prisma as any).shippingZone.findMany({
      orderBy: [{ pincodePrefix: 'asc' }, { createdAt: 'desc' }],
    });

    return zones.map((z: any) => ({
      id: z.id,
      zoneName: z.zoneName,
      pincodePrefix: z.pincodePrefix,
      shippingCharge: Number(z.shippingCharge),
      isActive: Boolean(z.isActive),
      createdAt: z.createdAt,
      updatedAt: z.updatedAt,
    }));
  }

  /**
   * Create a new regional pincode zone rate
   */
  async createZone(
    dto: CreateShippingZoneDto,
    actorId?: string,
  ): Promise<ShippingZoneRecord> {
    const cleanPrefix = dto.pincodePrefix.trim();
    if (!/^[0-9]{1,6}$/.test(cleanPrefix)) {
      throw new BadRequestException('Pincode or prefix must be 1 to 6 digits');
    }

    const existing = await (this.prisma as any).shippingZone.findUnique({
      where: { pincodePrefix: cleanPrefix },
    });
    if (existing) {
      throw new ConflictException(
        `A shipping zone for pincode prefix '${cleanPrefix}' already exists (${existing.zoneName})`,
      );
    }

    const created = await (this.prisma as any).shippingZone.create({
      data: {
        zoneName: dto.zoneName.trim(),
        pincodePrefix: cleanPrefix,
        shippingCharge: dto.shippingCharge,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'SHIPPING_ZONE_CREATED',
      entity: 'ShippingZone',
      entityId: created.id,
      newState: created,
    });

    return {
      id: created.id,
      zoneName: created.zoneName,
      pincodePrefix: created.pincodePrefix,
      shippingCharge: Number(created.shippingCharge),
      isActive: Boolean(created.isActive),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update an existing shipping zone
   */
  async updateZone(
    id: string,
    dto: UpdateShippingZoneDto,
    actorId?: string,
  ): Promise<ShippingZoneRecord> {
    const current = await (this.prisma as any).shippingZone.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException(`Shipping zone with ID '${id}' not found`);
    }

    let cleanPrefix = current.pincodePrefix;
    if (dto.pincodePrefix !== undefined) {
      cleanPrefix = dto.pincodePrefix.trim();
      if (!/^[0-9]{1,6}$/.test(cleanPrefix)) {
        throw new BadRequestException('Pincode or prefix must be 1 to 6 digits');
      }

      if (cleanPrefix !== current.pincodePrefix) {
        const existing = await (this.prisma as any).shippingZone.findUnique({
          where: { pincodePrefix: cleanPrefix },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `A shipping zone for pincode prefix '${cleanPrefix}' already exists (${existing.zoneName})`,
          );
        }
      }
    }

    const updated = await (this.prisma as any).shippingZone.update({
      where: { id },
      data: {
        ...(dto.zoneName !== undefined ? { zoneName: dto.zoneName.trim() } : {}),
        pincodePrefix: cleanPrefix,
        ...(dto.shippingCharge !== undefined ? { shippingCharge: dto.shippingCharge } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'SHIPPING_ZONE_UPDATED',
      entity: 'ShippingZone',
      entityId: id,
      previousState: current,
      newState: updated,
    });

    return {
      id: updated.id,
      zoneName: updated.zoneName,
      pincodePrefix: updated.pincodePrefix,
      shippingCharge: Number(updated.shippingCharge),
      isActive: Boolean(updated.isActive),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete a shipping zone
   */
  async deleteZone(id: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    const current = await (this.prisma as any).shippingZone.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException(`Shipping zone with ID '${id}' not found`);
    }

    await (this.prisma as any).shippingZone.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'SHIPPING_ZONE_DELETED',
      entity: 'ShippingZone',
      entityId: id,
      previousState: current,
    });

    return { success: true, message: `Zone '${current.zoneName}' deleted successfully` };
  }

  /**
   * Authoritative server calculation for shipping fee and GST.
   *
   * Matching rules:
   * 1. Read customer delivery pincode.
   * 2. Find all active configured zones matching pincode prefix.
   * 3. Most specific match wins (longest pincodePrefix).
   * 4. If no rule matches, fallback to default base shipping fee.
   * 5. If automatic free shipping is enabled and merchandise subtotal >= threshold, shipping = 0.
   * 6. If free shipping is disabled, threshold is not applied.
   * 7. Store pickup = 0 shipping fee.
   * 8. GST calculated dynamically from configured gstRate (default 18%).
   */
  async calculateShippingAndTax(
    subtotal: number,
    postalCode?: string,
    deliveryMethod: 'COURIER' | 'STORE_PICKUP' = 'COURIER',
    isInterState: boolean = false,
  ): Promise<ShippingTaxCalculationResult> {
    const settings = await this.getSettings();
    const cleanSubtotal = Math.max(0, Number(subtotal) || 0);

    let shippingFee = settings.baseShippingFee;
    let matchedZone: ShippingTaxCalculationResult['matchedZone'] = null;

    if (deliveryMethod === 'STORE_PICKUP') {
      shippingFee = 0;
    } else {
      const cleanPincode = (postalCode || '').trim().replace(/[^0-9]/g, '');

      if (cleanPincode.length > 0) {
        const activeZones = await (this.prisma as any).shippingZone.findMany({
          where: { isActive: true },
        });

        // Find all zones where the customer's pincode starts with the configured prefix
        const matchingZones = (activeZones || []).filter((z: any) =>
          cleanPincode.startsWith(z.pincodePrefix),
        );

        if (matchingZones.length > 0) {
          // Most specific matching rule wins (longest prefix length)
          matchingZones.sort(
            (a: any, b: any) => b.pincodePrefix.length - a.pincodePrefix.length,
          );
          const bestMatch = matchingZones[0];
          shippingFee = Number(bestMatch.shippingCharge);
          matchedZone = {
            id: bestMatch.id,
            zoneName: bestMatch.zoneName,
            pincodePrefix: bestMatch.pincodePrefix,
            shippingCharge: Number(bestMatch.shippingCharge),
          };
        }
      }

      // Automatic Free Shipping Threshold Evaluation:
      // If feature is enabled AND subtotal reaches threshold, shipping charge is ₹0
      if (
        settings.isFreeShippingEnabled &&
        settings.freeShippingThreshold > 0 &&
        cleanSubtotal >= settings.freeShippingThreshold
      ) {
        shippingFee = 0;
      }
    }

    const isFreeShippingApplied =
      deliveryMethod !== 'STORE_PICKUP' &&
      settings.isFreeShippingEnabled &&
      settings.freeShippingThreshold > 0 &&
      cleanSubtotal >= settings.freeShippingThreshold;

    // Dynamic GST Calculation according to configured policy
    const taxRate = settings.gstRate / 100;
    const gstAmount = Math.round(cleanSubtotal * taxRate * 100) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = gstAmount;
    } else {
      cgst = Math.round((gstAmount / 2) * 100) / 100;
      sgst = Math.round((gstAmount - cgst) * 100) / 100;
    }

    const grandTotal = Math.round((cleanSubtotal + gstAmount + shippingFee) * 100) / 100;

    return {
      subtotal: cleanSubtotal,
      shippingFee,
      baseShippingFee: settings.baseShippingFee,
      isFreeShippingApplied,
      freeShippingThreshold: settings.freeShippingThreshold,
      isFreeShippingEnabled: settings.isFreeShippingEnabled,
      matchedZone,
      gstRatePercent: settings.gstRate,
      gstAmount,
      cgst,
      sgst,
      igst,
      deliveryMethod,
      grandTotal,
    };
  }
}
