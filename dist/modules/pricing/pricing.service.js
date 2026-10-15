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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shipping_gst_service_1 = require("../shipping-gst/shipping-gst.service");
let PricingService = class PricingService {
    prisma;
    shippingGstService;
    constructor(prisma, shippingGstService) {
        this.prisma = prisma;
        this.shippingGstService = shippingGstService;
    }
    async calculateQuote(dto) {
        let product = await this.prisma.product.findFirst({
            where: {
                OR: [
                    { id: dto.productId },
                    { slug: dto.productId },
                    { sku: dto.productId },
                ],
            },
            include: {
                fields: {
                    include: {
                        options: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                options: {
                    include: {
                        values: true,
                    },
                },
                pricingMatrices: {
                    orderBy: { minQty: 'asc' },
                },
            },
        });
        if (!product) {
            product = await this.prisma.product.findFirst({
                where: { status: 'PUBLISHED' },
                include: {
                    fields: {
                        include: {
                            options: true,
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                    options: {
                        include: {
                            values: true,
                        },
                    },
                    pricingMatrices: {
                        orderBy: { minQty: 'asc' },
                    },
                },
            });
        }
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID '${dto.productId}' not found`);
        }
        if (dto.quantity < product.minQuantity) {
            throw new common_1.BadRequestException(`Minimum quantity for ${product.name} is ${product.minQuantity}`);
        }
        if (dto.quantity > product.maxQuantity) {
            throw new common_1.BadRequestException(`Maximum quantity for ${product.name} is ${product.maxQuantity}`);
        }
        const userSelections = { ...(dto.fieldValues || {}) };
        if (dto.options && dto.options.length > 0) {
            for (const opt of dto.options) {
                if (!userSelections[opt.optionCode]) {
                    userSelections[opt.optionCode] = opt.valueCode;
                }
            }
        }
        let optionsUnitModifier = 0;
        let percentageModifierTotal = 0;
        const selectedOptionsSummary = [];
        const specificationsSnapshot = {};
        if (product.fields && product.fields.length > 0) {
            for (const field of product.fields) {
                let isVisible = true;
                if (field.conditionalLogic && typeof field.conditionalLogic === 'object') {
                    const logic = field.conditionalLogic;
                    const parentVal = userSelections[logic.dependsOnFieldKey];
                    if (logic.operator === 'EQUALS' && parentVal !== logic.value) {
                        isVisible = false;
                    }
                    else if (logic.operator === 'NOT_EQUALS' && parentVal === logic.value) {
                        isVisible = false;
                    }
                    else if (logic.operator === 'IN' && Array.isArray(logic.value) && !logic.value.includes(parentVal)) {
                        isVisible = false;
                    }
                }
                if (!isVisible) {
                    continue;
                }
                const selectedVal = userSelections[field.key];
                if (field.isRequired && (selectedVal === undefined || selectedVal === null || selectedVal === '')) {
                    const defaultOpt = field.options.find((o) => o.isDefault) || field.options[0];
                    if (defaultOpt) {
                        userSelections[field.key] = defaultOpt.value;
                    }
                }
                const activeVal = userSelections[field.key];
                if (activeVal === undefined || activeVal === null || activeVal === '') {
                    continue;
                }
                const matchedOption = field.options.find((o) => o.value === String(activeVal));
                if (matchedOption) {
                    const modVal = Number(matchedOption.priceModifier);
                    if (matchedOption.priceModifierType === 'FIXED' || matchedOption.priceModifierType === 'PER_UNIT') {
                        optionsUnitModifier += modVal;
                    }
                    else if (matchedOption.priceModifierType === 'PERCENTAGE') {
                        percentageModifierTotal += modVal;
                    }
                    selectedOptionsSummary.push({
                        optionName: field.label,
                        optionCode: field.key,
                        valueName: matchedOption.label,
                        valueCode: matchedOption.value,
                        priceModifier: modVal,
                    });
                    specificationsSnapshot[field.key] = {
                        label: field.label,
                        value: matchedOption.value,
                        displayValue: matchedOption.label,
                        priceModifier: modVal,
                    };
                }
                else {
                    specificationsSnapshot[field.key] = {
                        label: field.label,
                        value: activeVal,
                        displayValue: String(activeVal),
                    };
                }
            }
        }
        if (product.options && product.options.length > 0) {
            const optionMap = new Map(product.options.map((opt) => [opt.code, opt]));
            for (const [key, valCode] of Object.entries(userSelections)) {
                const opt = optionMap.get(key);
                if (!opt)
                    continue;
                if (selectedOptionsSummary.some((s) => s.optionCode === key))
                    continue;
                const val = opt.values.find((v) => v.code === valCode);
                if (!val)
                    continue;
                const modVal = Number(val.priceModifier);
                if (val.priceModifierType === 'FIXED' || val.priceModifierType === 'PER_UNIT') {
                    optionsUnitModifier += modVal;
                }
                else if (val.priceModifierType === 'PERCENTAGE') {
                    percentageModifierTotal += modVal;
                }
                selectedOptionsSummary.push({
                    optionName: opt.name,
                    optionCode: opt.code,
                    valueName: val.name,
                    valueCode: val.code,
                    priceModifier: modVal,
                });
                specificationsSnapshot[opt.code] = {
                    label: opt.name,
                    value: val.code,
                    displayValue: val.name,
                    priceModifier: modVal,
                };
            }
        }
        const originalBasePrice = Number(product.basePrice);
        let baseUnitPrice = originalBasePrice;
        let appliedOffer = null;
        const availableOffers = [];
        let matchedSpecificCombo = false;
        const isSingleTypeProduct = product.pricingModel === 'SINGLE' ||
            product.pricingModel === 'SINGLE_RANGE' ||
            (product.tags && product.tags.includes('SINGLE_TYPE'));
        if (isSingleTypeProduct && product.pricingMatrices && product.pricingMatrices.length > 0) {
            const sortedMatrices = [...product.pricingMatrices].sort((a, b) => a.minQty - b.minQty);
            for (const m of sortedMatrices) {
                const combo = m.attributeCombination || {};
                const isBase = combo.isBasePrice === true || combo.type === 'BASE' || !combo.attributeCode;
                if (isBase) {
                    const rulePrice = Number(m.unitPrice);
                    const label = m.minQty === m.maxQty
                        ? `Qty ${m.minQty}: ₹${rulePrice.toFixed(2)}/pc`
                        : `Qty ${m.minQty}–${m.maxQty}: ₹${rulePrice.toFixed(2)}/pc`;
                    availableOffers.push({
                        id: m.id,
                        minQty: m.minQty,
                        maxQty: m.maxQty,
                        discountPercent: originalBasePrice > rulePrice && originalBasePrice > 0
                            ? Math.round(((originalBasePrice - rulePrice) / originalBasePrice) * 100)
                            : 0,
                        unitPrice: rulePrice,
                        label,
                    });
                }
            }
            const matchingRangeRules = product.pricingMatrices.filter((m) => dto.quantity >= m.minQty && (m.maxQty === null || m.maxQty === undefined || dto.quantity <= m.maxQty));
            if (matchingRangeRules.length > 0) {
                const baseRule = matchingRangeRules.find((m) => {
                    const combo = m.attributeCombination || {};
                    return (combo.isBasePrice === true ||
                        combo.type === 'BASE' ||
                        (!combo.attributeCode && !combo.type) ||
                        Object.keys(combo).filter((k) => !['label', 'rangeLabel', 'quantityRanges', 'discountPercent', 'offerName', 'isBasePrice', 'type'].includes(k)).length === 0);
                }) || matchingRangeRules[0];
                baseUnitPrice = Number(baseRule.unitPrice);
                let singleTypeAddonModifier = 0;
                for (const [fieldKey, userVal] of Object.entries(userSelections)) {
                    if (userVal === undefined || userVal === null || userVal === '')
                        continue;
                    const attrRule = matchingRangeRules.find((m) => {
                        const combo = m.attributeCombination || {};
                        return ((combo.type === 'ATTRIBUTE' &&
                            combo.attributeCode?.toLowerCase() === fieldKey.toLowerCase() &&
                            String(combo.attributeValue)?.toLowerCase() === String(userVal).toLowerCase()) ||
                            (combo[fieldKey] !== undefined && String(combo[fieldKey]) === String(userVal)));
                    });
                    if (attrRule) {
                        const rawVal = Number(attrRule.unitPrice || attrRule.attributeCombination?.extraPrice || 0);
                        const extra = rawVal > baseUnitPrice && baseUnitPrice > 0 ? rawVal - baseUnitPrice : rawVal;
                        if (extra > 0) {
                            singleTypeAddonModifier += extra;
                            const existingSummary = selectedOptionsSummary.find((s) => s.optionCode === fieldKey);
                            if (existingSummary) {
                                existingSummary.priceModifier = extra;
                            }
                        }
                    }
                }
                if (singleTypeAddonModifier > 0) {
                    optionsUnitModifier = singleTypeAddonModifier;
                }
                const firstBaseRule = sortedMatrices.find((m) => {
                    const combo = m.attributeCombination || {};
                    return combo.isBasePrice === true || combo.type === 'BASE';
                }) || sortedMatrices[0];
                const firstRate = Number(firstBaseRule.unitPrice);
                if (firstRate > baseUnitPrice && firstRate > 0) {
                    const savingsPerUnit = firstRate - baseUnitPrice;
                    const disc = Math.round((savingsPerUnit / firstRate) * 100);
                    appliedOffer = {
                        offerId: baseRule.id,
                        minQty: baseRule.minQty,
                        maxQty: baseRule.maxQty,
                        discountPercent: disc,
                        offerName: `Volume Savings (${disc}% OFF for Qty ${baseRule.minQty}–${baseRule.maxQty})`,
                        savingsAmount: Math.round(savingsPerUnit * dto.quantity * 100) / 100,
                    };
                }
            }
        }
        else if (product.pricingMatrices && product.pricingMatrices.length > 0) {
            const sortedMatrices = [...product.pricingMatrices].sort((a, b) => a.minQty - b.minQty);
            const reusableAttrs = await this.prisma.reusableAttribute.findMany({
                where: { isActive: true },
            });
            const addOnCodes = new Set((reusableAttrs || [])
                .filter((a) => {
                const opts = Array.isArray(a.options) ? a.options : [];
                return opts.some((o) => o.isOptionalAddOn === true) || Boolean(opts[0]?.isOptionalAddOn || a.isOptionalAddOn);
            })
                .map((a) => String(a.code).toLowerCase()));
            let bestMatchingRule = null;
            let highestMatchSpecificity = -1;
            for (const m of sortedMatrices) {
                const combo = m.attributeCombination || {};
                const ruleUnitPrice = Number(m.unitPrice);
                let discountPercent = combo.discountPercent !== undefined ? Number(combo.discountPercent) : 0;
                if (!discountPercent && ruleUnitPrice < originalBasePrice && originalBasePrice > 0) {
                    discountPercent = Math.round(((originalBasePrice - ruleUnitPrice) / originalBasePrice) * 100);
                }
                const label = combo.label ||
                    combo.offerName ||
                    (discountPercent > 0
                        ? `${discountPercent}% OFF (${m.minQty.toLocaleString()}–${m.maxQty.toLocaleString()} units)`
                        : `Special Tier Price (${m.minQty.toLocaleString()}–${m.maxQty.toLocaleString()} units)`);
                availableOffers.push({
                    id: m.id,
                    minQty: m.minQty,
                    maxQty: m.maxQty,
                    discountPercent,
                    unitPrice: ruleUnitPrice,
                    label,
                });
                if (dto.quantity >= m.minQty && (!m.maxQty || dto.quantity <= m.maxQty)) {
                    const comboEntries = Object.entries(combo).filter(([k]) => k !== 'discountPercent' && k !== 'label' && k !== 'offerName');
                    if (comboEntries.length === 0) {
                        if (highestMatchSpecificity < 0) {
                            bestMatchingRule = { rule: m, discountPercent, label, isSpecific: false };
                            highestMatchSpecificity = 0;
                        }
                    }
                    else {
                        const allMatch = comboEntries.every(([k, v]) => String(userSelections[k]) === String(v));
                        if (allMatch && comboEntries.length > highestMatchSpecificity) {
                            bestMatchingRule = { rule: m, discountPercent, label, isSpecific: true };
                            highestMatchSpecificity = comboEntries.length;
                        }
                    }
                }
            }
            if (bestMatchingRule) {
                const { rule, discountPercent, label, isSpecific } = bestMatchingRule;
                const ruleUnitPrice = Number(rule.unitPrice);
                if (discountPercent > 0) {
                    baseUnitPrice = Math.round(originalBasePrice * (1 - discountPercent / 100) * 10000) / 10000;
                }
                else if (ruleUnitPrice > 0) {
                    baseUnitPrice = ruleUnitPrice;
                    if (originalBasePrice > ruleUnitPrice) {
                        const calculatedDisc = Math.round(((originalBasePrice - ruleUnitPrice) / originalBasePrice) * 100);
                        appliedOffer = {
                            offerId: rule.id,
                            minQty: rule.minQty,
                            maxQty: rule.maxQty,
                            discountPercent: calculatedDisc,
                            offerName: label,
                            savingsAmount: Math.round((originalBasePrice - ruleUnitPrice) * dto.quantity * 100) / 100,
                        };
                    }
                }
                if (isSpecific) {
                    matchedSpecificCombo = true;
                    optionsUnitModifier = 0;
                }
                if (!appliedOffer && discountPercent > 0) {
                    const savingsPerUnit = Math.max(0, originalBasePrice - baseUnitPrice);
                    appliedOffer = {
                        offerId: rule.id,
                        minQty: rule.minQty,
                        maxQty: rule.maxQty,
                        discountPercent,
                        offerName: label,
                        savingsAmount: Math.round(savingsPerUnit * dto.quantity * 100) / 100,
                    };
                }
            }
        }
        if (!appliedOffer && (!product.pricingMatrices || product.pricingMatrices.length === 0)) {
            if (dto.quantity >= 5000) {
                baseUnitPrice = Math.round(originalBasePrice * 0.82 * 10000) / 10000;
                appliedOffer = {
                    offerId: 'tier-5000',
                    minQty: 5000,
                    maxQty: 100000,
                    discountPercent: 18,
                    offerName: 'Volume Tier Savings (18% OFF)',
                    savingsAmount: Math.round(originalBasePrice * 0.18 * dto.quantity * 100) / 100,
                };
            }
            else if (dto.quantity >= 1000) {
                baseUnitPrice = Math.round(originalBasePrice * 0.90 * 10000) / 10000;
                appliedOffer = {
                    offerId: 'tier-1000',
                    minQty: 1000,
                    maxQty: 4999,
                    discountPercent: 10,
                    offerName: 'Volume Tier Savings (10% OFF)',
                    savingsAmount: Math.round(originalBasePrice * 0.10 * dto.quantity * 100) / 100,
                };
            }
            else if (dto.quantity >= 500) {
                baseUnitPrice = Math.round(originalBasePrice * 0.95 * 10000) / 10000;
                appliedOffer = {
                    offerId: 'tier-500',
                    minQty: 500,
                    maxQty: 999,
                    discountPercent: 5,
                    offerName: 'Volume Tier Savings (5% OFF)',
                    savingsAmount: Math.round(originalBasePrice * 0.05 * dto.quantity * 100) / 100,
                };
            }
        }
        let artworkFee = 0;
        const artworkReq = product.artworkRequirement || 'OPTIONAL';
        const rawArtworkPrice = Number(product.artworkPrice) || 0;
        if (artworkReq === 'REQUIRED') {
            artworkFee = rawArtworkPrice;
        }
        else if (artworkReq === 'OPTIONAL' && dto.hasArtwork) {
            artworkFee = rawArtworkPrice;
        }
        let designServiceFee = 0;
        const designReq = product.designServiceRequirement || 'DISABLED';
        const rawDesignPrice = Number(product.designServicePrice) || 0;
        if (designReq === 'REQUIRED') {
            designServiceFee = rawDesignPrice;
        }
        else if (designReq === 'OPTIONAL' && dto.hasDesignService) {
            designServiceFee = rawDesignPrice;
        }
        const refReq = product.referenceImageRequirement || 'DISABLED';
        let unitPrice = (baseUnitPrice + optionsUnitModifier) * (1 + percentageModifierTotal / 100);
        unitPrice = Math.round(unitPrice * 100) / 100;
        const baseSubtotal = Math.round(originalBasePrice * dto.quantity * 100) / 100;
        const dynamicModifiersTotal = Math.round(optionsUnitModifier * dto.quantity * 100) / 100;
        const discountAmount = appliedOffer ? appliedOffer.savingsAmount : 0;
        const discountPercent = appliedOffer ? appliedOffer.discountPercent : 0;
        const printItemsTotal = Math.round(unitPrice * dto.quantity * 100) / 100;
        const subtotal = Math.round((printItemsTotal + artworkFee + designServiceFee) * 100) / 100;
        const deliveryMethod = dto.deliveryMethod || 'COURIER';
        const shipTaxResult = await this.shippingGstService.calculateShippingAndTax(subtotal, dto.shippingPincode, deliveryMethod === 'STORE_PICKUP' ? 'STORE_PICKUP' : 'COURIER', dto.isInterState || false);
        const cgst = shipTaxResult.cgst;
        const sgst = shipTaxResult.sgst;
        const igst = shipTaxResult.igst;
        const totalTax = shipTaxResult.gstAmount;
        const estimatedShipping = shipTaxResult.shippingFee;
        const courierRate = shipTaxResult.baseShippingFee;
        const freeShippingThreshold = shipTaxResult.freeShippingThreshold;
        const allowCod = false;
        const codSurcharge = 0;
        const codCharge = 0;
        const paymentMethod = dto.paymentMethod || 'FULL';
        const grandTotal = Math.round((subtotal + totalTax + estimatedShipping) * 100) / 100;
        specificationsSnapshot['_artworkRequirement'] = {
            requirement: artworkReq,
            price: rawArtworkPrice,
            feeApplied: artworkFee,
            qualityVerification: product.artworkQualityVerification,
            minimumMegapixels: product.minimumArtworkMegapixels,
        };
        specificationsSnapshot['_referenceImageRequirement'] = {
            requirement: refReq,
        };
        specificationsSnapshot['_designServiceRequirement'] = {
            requirement: designReq,
            price: rawDesignPrice,
            feeApplied: designServiceFee,
        };
        specificationsSnapshot['_fulfillment'] = {
            deliveryMethod,
            courierCharge: courierRate,
            freeShippingThreshold,
            shippingApplied: estimatedShipping,
            paymentMethod,
            allowCod,
            codSurcharge,
            codChargeApplied: codCharge,
        };
        if (appliedOffer) {
            specificationsSnapshot['_appliedOffer'] = appliedOffer;
        }
        return {
            basePrice: originalBasePrice,
            originalBasePrice,
            effectiveBasePrice: baseUnitPrice,
            quantity: dto.quantity,
            baseSubtotal,
            optionsCost: dynamicModifiersTotal,
            dynamicModifiersTotal,
            discountAmount,
            discountPercent,
            artworkFee,
            designServiceFee,
            artworkRequirement: artworkReq,
            designServiceRequirement: designReq,
            referenceImageRequirement: refReq,
            unitPrice,
            subtotal,
            cgst,
            sgst,
            igst,
            totalTax,
            courierCharge: courierRate,
            freeShippingThreshold,
            estimatedShipping,
            matchedZone: shipTaxResult.matchedZone,
            isFreeShippingApplied: shipTaxResult.isFreeShippingApplied,
            gstRatePercent: shipTaxResult.gstRatePercent,
            allowCod,
            codSurcharge,
            codCharge,
            deliveryMethod,
            paymentMethod,
            grandTotal,
            productionDays: product.productionDays,
            appliedOffer,
            availableOffers,
            selectedOptionsSummary,
            specificationsSnapshot,
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        shipping_gst_service_1.ShippingGstService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map