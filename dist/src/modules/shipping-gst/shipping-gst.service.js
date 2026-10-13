"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ShippingGstService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingGstService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ShippingGstService = class ShippingGstService {
    static { ShippingGstService_1 = this; }
    prisma;
    auditService;
    logger = new common_1.Logger(ShippingGstService_1.name);
    static SETTING_ID = 'default';
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getSettings() {
        let setting = await this.prisma.shippingGstSetting.findUnique({
            where: { id: ShippingGstService_1.SETTING_ID },
        });
        if (!setting) {
            setting = await this.prisma.shippingGstSetting.create({
                data: {
                    id: ShippingGstService_1.SETTING_ID,
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
    async updateSettings(dto, actorId) {
        const current = await this.getSettings();
        const updated = await this.prisma.shippingGstSetting.upsert({
            where: { id: ShippingGstService_1.SETTING_ID },
            create: {
                id: ShippingGstService_1.SETTING_ID,
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
            entityId: ShippingGstService_1.SETTING_ID,
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
    async listZones() {
        const zones = await this.prisma.shippingZone.findMany({
            orderBy: [{ pincodePrefix: 'asc' }, { createdAt: 'desc' }],
        });
        return zones.map((z) => ({
            id: z.id,
            zoneName: z.zoneName,
            pincodePrefix: z.pincodePrefix,
            shippingCharge: Number(z.shippingCharge),
            isActive: Boolean(z.isActive),
            createdAt: z.createdAt,
            updatedAt: z.updatedAt,
        }));
    }
    async createZone(dto, actorId) {
        const cleanPrefix = dto.pincodePrefix.trim();
        if (!/^[0-9]{1,6}$/.test(cleanPrefix)) {
            throw new common_1.BadRequestException('Pincode or prefix must be 1 to 6 digits');
        }
        const existing = await this.prisma.shippingZone.findUnique({
            where: { pincodePrefix: cleanPrefix },
        });
        if (existing) {
            throw new common_1.ConflictException(`A shipping zone for pincode prefix '${cleanPrefix}' already exists (${existing.zoneName})`);
        }
        const created = await this.prisma.shippingZone.create({
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
    async updateZone(id, dto, actorId) {
        const current = await this.prisma.shippingZone.findUnique({
            where: { id },
        });
        if (!current) {
            throw new common_1.NotFoundException(`Shipping zone with ID '${id}' not found`);
        }
        let cleanPrefix = current.pincodePrefix;
        if (dto.pincodePrefix !== undefined) {
            cleanPrefix = dto.pincodePrefix.trim();
            if (!/^[0-9]{1,6}$/.test(cleanPrefix)) {
                throw new common_1.BadRequestException('Pincode or prefix must be 1 to 6 digits');
            }
            if (cleanPrefix !== current.pincodePrefix) {
                const existing = await this.prisma.shippingZone.findUnique({
                    where: { pincodePrefix: cleanPrefix },
                });
                if (existing && existing.id !== id) {
                    throw new common_1.ConflictException(`A shipping zone for pincode prefix '${cleanPrefix}' already exists (${existing.zoneName})`);
                }
            }
        }
        const updated = await this.prisma.shippingZone.update({
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
    async deleteZone(id, actorId) {
        const current = await this.prisma.shippingZone.findUnique({
            where: { id },
        });
        if (!current) {
            throw new common_1.NotFoundException(`Shipping zone with ID '${id}' not found`);
        }
        await this.prisma.shippingZone.delete({ where: { id } });
        await this.auditService.log({
            actorId,
            action: 'SHIPPING_ZONE_DELETED',
            entity: 'ShippingZone',
            entityId: id,
            previousState: current,
        });
        return { success: true, message: `Zone '${current.zoneName}' deleted successfully` };
    }
    async calculateShippingAndTax(subtotal, postalCode, deliveryMethod = 'COURIER', isInterState = false) {
        const settings = await this.getSettings();
        const cleanSubtotal = Math.max(0, Number(subtotal) || 0);
        let shippingFee = settings.baseShippingFee;
        let matchedZone = null;
        if (deliveryMethod === 'STORE_PICKUP') {
            shippingFee = 0;
        }
        else {
            const cleanPincode = (postalCode || '').trim().replace(/[^0-9]/g, '');
            if (cleanPincode.length > 0) {
                const activeZones = await this.prisma.shippingZone.findMany({
                    where: { isActive: true },
                });
                const matchingZones = (activeZones || []).filter((z) => cleanPincode.startsWith(z.pincodePrefix));
                if (matchingZones.length > 0) {
                    matchingZones.sort((a, b) => b.pincodePrefix.length - a.pincodePrefix.length);
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
            if (settings.isFreeShippingEnabled &&
                settings.freeShippingThreshold > 0 &&
                cleanSubtotal >= settings.freeShippingThreshold) {
                shippingFee = 0;
            }
        }
        const isFreeShippingApplied = deliveryMethod !== 'STORE_PICKUP' &&
            settings.isFreeShippingEnabled &&
            settings.freeShippingThreshold > 0 &&
            cleanSubtotal >= settings.freeShippingThreshold;
        const taxRate = settings.gstRate / 100;
        const gstAmount = Math.round(cleanSubtotal * taxRate * 100) / 100;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (isInterState) {
            igst = gstAmount;
        }
        else {
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
};
exports.ShippingGstService = ShippingGstService;
exports.ShippingGstService = ShippingGstService = ShippingGstService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ShippingGstService);
//# sourceMappingURL=shipping-gst.service.js.map