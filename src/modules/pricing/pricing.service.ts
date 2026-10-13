import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingGstService } from '../shipping-gst/shipping-gst.service';

export interface OptionSelectionDto {
  optionCode: string;
  valueCode: string;
}

export interface QuoteCalculationRequestDto {
  productId: string;
  quantity: number;
  options?: OptionSelectionDto[];
  fieldValues?: Record<string, any>; // Key-value map from dynamic fields
  hasArtwork?: boolean;
  hasDesignService?: boolean;
  hasReferenceImage?: boolean;
  shippingPincode?: string;
  isInterState?: boolean;
  deliveryMethod?: 'COURIER' | 'STORE_PICKUP' | 'LOCAL_EXPRESS_BIKE';
  paymentMethod?: 'FULL' | 'SPLIT_50' | 'COD' | 'ONLINE';
  isCod?: boolean;
}

export interface QuoteItemBreakdown {
  basePrice: number;
  originalBasePrice: number;
  effectiveBasePrice: number;
  quantity: number;
  baseSubtotal: number;
  optionsCost: number;
  dynamicModifiersTotal: number;
  discountAmount: number;
  discountPercent: number;
  artworkFee: number;
  designServiceFee: number;
  artworkRequirement: string;
  designServiceRequirement: string;
  referenceImageRequirement: string;
  unitPrice: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  courierCharge: number;
  freeShippingThreshold: number;
  estimatedShipping: number;
  matchedZone?: { id: string; zoneName: string; pincodePrefix: string; shippingCharge: number } | null;
  isFreeShippingApplied?: boolean;
  gstRatePercent?: number;
  allowCod: boolean;
  codSurcharge: number;
  codCharge: number;
  deliveryMethod: string;
  paymentMethod: string;
  grandTotal: number;
  productionDays: number;
  appliedOffer?: {
    offerId: string;
    minQty: number;
    maxQty: number;
    discountPercent: number;
    offerName: string;
    savingsAmount: number;
  } | null;
  availableOffers?: Array<{
    id: string;
    minQty: number;
    maxQty: number;
    discountPercent: number;
    unitPrice: number;
    label: string;
  }>;
  selectedOptionsSummary: Array<{
    optionName: string;
    optionCode: string;
    valueName: string;
    valueCode: string;
    priceModifier: number;
  }>;
  specificationsSnapshot: Record<string, any>;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingGstService: ShippingGstService,
  ) {}

  async calculateQuote(dto: QuoteCalculationRequestDto): Promise<QuoteItemBreakdown> {
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
      throw new NotFoundException(`Product with ID '${dto.productId}' not found`);
    }

    if (dto.quantity < product.minQuantity) {
      throw new BadRequestException(`Minimum quantity for ${product.name} is ${product.minQuantity}`);
    }

    if (dto.quantity > product.maxQuantity) {
      throw new BadRequestException(`Maximum quantity for ${product.name} is ${product.maxQuantity}`);
    }

    // Merge options into unified fieldValues map
    const userSelections: Record<string, any> = { ...(dto.fieldValues || {}) };
    if (dto.options && dto.options.length > 0) {
      for (const opt of dto.options) {
        if (!userSelections[opt.optionCode]) {
          userSelections[opt.optionCode] = opt.valueCode;
        }
      }
    }

    let optionsUnitModifier = 0;
    let percentageModifierTotal = 0;
    const selectedOptionsSummary: QuoteItemBreakdown['selectedOptionsSummary'] = [];
    const specificationsSnapshot: Record<string, any> = {};

    // 1. Process Modern Dynamic Fields (if configured)
    if (product.fields && product.fields.length > 0) {
      for (const field of product.fields) {
        // Check conditional visibility
        let isVisible = true;
        if (field.conditionalLogic && typeof field.conditionalLogic === 'object') {
          const logic = field.conditionalLogic as {
            dependsOnFieldKey: string;
            operator: string;
            value: any;
          };
          const parentVal = userSelections[logic.dependsOnFieldKey];

          if (logic.operator === 'EQUALS' && parentVal !== logic.value) {
            isVisible = false;
          } else if (logic.operator === 'NOT_EQUALS' && parentVal === logic.value) {
            isVisible = false;
          } else if (logic.operator === 'IN' && Array.isArray(logic.value) && !logic.value.includes(parentVal)) {
            isVisible = false;
          }
        }

        if (!isVisible) {
          continue; // Skip hidden conditional field from validation & pricing
        }

        const selectedVal = userSelections[field.key];

        // Required validation
        if (field.isRequired && (selectedVal === undefined || selectedVal === null || selectedVal === '')) {
          // If a default option is available, use it
          const defaultOpt = field.options.find((o) => o.isDefault) || field.options[0];
          if (defaultOpt) {
            userSelections[field.key] = defaultOpt.value;
          }
        }

        const activeVal = userSelections[field.key];
        if (activeVal === undefined || activeVal === null || activeVal === '') {
          continue;
        }

        // For Option-based fields: find matching option and add modifier
        const matchedOption = field.options.find((o) => o.value === String(activeVal));
        if (matchedOption) {
          const modVal = Number(matchedOption.priceModifier);
          if (matchedOption.priceModifierType === 'FIXED' || matchedOption.priceModifierType === 'PER_UNIT') {
            optionsUnitModifier += modVal;
          } else if (matchedOption.priceModifierType === 'PERCENTAGE') {
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
        } else {
          // Freeform value (number, text, etc.)
          specificationsSnapshot[field.key] = {
            label: field.label,
            value: activeVal,
            displayValue: String(activeVal),
          };
        }
      }
    }

    // 2. Process Legacy Options (if present and not already processed)
    if (product.options && product.options.length > 0) {
      const optionMap = new Map(product.options.map((opt) => [opt.code, opt]));

      for (const [key, valCode] of Object.entries(userSelections)) {
        const opt = optionMap.get(key);
        if (!opt) continue;

        // Skip if already in summary
        if (selectedOptionsSummary.some((s) => s.optionCode === key)) continue;

        const val = opt.values.find((v) => v.code === valCode);
        if (!val) continue;

        const modVal = Number(val.priceModifier);
        if (val.priceModifierType === 'FIXED' || val.priceModifierType === 'PER_UNIT') {
          optionsUnitModifier += modVal;
        } else if (val.priceModifierType === 'PERCENTAGE') {
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

    // 3. Matrix & Quantity Tier Offer Calculation
    const originalBasePrice = Number(product.basePrice);
    let baseUnitPrice = originalBasePrice;
    let appliedOffer: QuoteItemBreakdown['appliedOffer'] = null;
    const availableOffers: NonNullable<QuoteItemBreakdown['availableOffers']> = [];
    let matchedSpecificCombo = false;

    const isSingleTypeProduct =
      product.pricingModel === 'SINGLE' ||
      product.pricingModel === 'SINGLE_RANGE' ||
      (product.tags && product.tags.includes('SINGLE_TYPE'));

    if (isSingleTypeProduct && product.pricingMatrices && product.pricingMatrices.length > 0) {
      // Single Type Range Pricing Calculation
      const sortedMatrices = [...product.pricingMatrices].sort((a, b) => a.minQty - b.minQty);

      // Collect available offers for each range
      for (const m of sortedMatrices) {
        const combo = (m.attributeCombination as any) || {};
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

      // Find the range rules matching the requested quantity
      const matchingRangeRules = product.pricingMatrices.filter(
        (m) => dto.quantity >= m.minQty && (m.maxQty === null || m.maxQty === undefined || dto.quantity <= m.maxQty),
      );

      if (matchingRangeRules.length > 0) {
        // 1. Base price rule for this range
        const baseRule = matchingRangeRules.find((m) => {
          const combo = (m.attributeCombination as any) || {};
          return (
            combo.isBasePrice === true ||
            combo.type === 'BASE' ||
            (!combo.attributeCode && !combo.type) ||
            Object.keys(combo).filter(
              (k) => !['label', 'rangeLabel', 'quantityRanges', 'discountPercent', 'offerName', 'isBasePrice', 'type'].includes(k),
            ).length === 0
          );
        }) || matchingRangeRules[0];

        baseUnitPrice = Number(baseRule.unitPrice);

        // 2. Additional Attribute / Add-on prices for this range
        let singleTypeAddonModifier = 0;
        for (const [fieldKey, userVal] of Object.entries(userSelections)) {
          if (userVal === undefined || userVal === null || userVal === '') continue;

          const attrRule = matchingRangeRules.find((m) => {
            const combo = (m.attributeCombination as any) || {};
            return (
              (combo.type === 'ATTRIBUTE' &&
                combo.attributeCode?.toLowerCase() === fieldKey.toLowerCase() &&
                String(combo.attributeValue)?.toLowerCase() === String(userVal).toLowerCase()) ||
              (combo[fieldKey] !== undefined && String(combo[fieldKey]) === String(userVal))
            );
          });

          if (attrRule) {
            const rawVal = Number(attrRule.unitPrice || (attrRule.attributeCombination as any)?.extraPrice || 0);
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

        // If range-specific attribute modifiers were configured, apply them
        if (singleTypeAddonModifier > 0) {
          optionsUnitModifier = singleTypeAddonModifier;
        }

        // Determine if customer qualifies for volume savings compared to first bracket
        const firstBaseRule = sortedMatrices.find((m) => {
          const combo = (m.attributeCombination as any) || {};
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
    } else if (product.pricingMatrices && product.pricingMatrices.length > 0) {
      const sortedMatrices = [...product.pricingMatrices].sort((a, b) => a.minQty - b.minQty);

      // Fetch active reusable attributes to identify which are configured as optional add-ons
      const reusableAttrs = await (this.prisma as any).reusableAttribute.findMany({
        where: { isActive: true },
      });
      const addOnCodes = new Set<string>(
        (reusableAttrs || [])
          .filter((a: any) => Boolean(a.options?.[0]?.isOptionalAddOn || a.isOptionalAddOn))
          .map((a: any) => String(a.code).toLowerCase()),
      );

      // Track the best matching matrix rule for the current requested quantity & attributes
      let bestMatchingRule: any = null;
      let highestMatchSpecificity = -1;

      for (const m of sortedMatrices) {
        const combo = (m.attributeCombination as any) || {};
        const ruleUnitPrice = Number(m.unitPrice);
        let discountPercent =
          combo.discountPercent !== undefined ? Number(combo.discountPercent) : 0;

        if (!discountPercent && ruleUnitPrice < originalBasePrice && originalBasePrice > 0) {
          discountPercent = Math.round(((originalBasePrice - ruleUnitPrice) / originalBasePrice) * 100);
        }

        const label =
          combo.label ||
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

        // Check if current quantity qualifies for this matrix rule
        if (dto.quantity >= m.minQty && (!m.maxQty || dto.quantity <= m.maxQty)) {
          const comboEntries = Object.entries(combo).filter(
            ([k]) => k !== 'discountPercent' && k !== 'label' && k !== 'offerName',
          );

          if (comboEntries.length === 0) {
            // Base rule (no specific attributes required)
            if (highestMatchSpecificity < 0) {
              bestMatchingRule = { rule: m, discountPercent, label, isSpecific: false };
              highestMatchSpecificity = 0;
            }
          } else {
            // Specific attribute combination rule: verify all combo keys match user selections
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
        } else if (ruleUnitPrice > 0) {
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
          // The matrix unit price is the complete price for this variant, avoid double-charging option modifiers
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

    // Default volume savings tier only if product has NO pricing matrices configured by admin
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
      } else if (dto.quantity >= 1000) {
        baseUnitPrice = Math.round(originalBasePrice * 0.90 * 10000) / 10000;
        appliedOffer = {
          offerId: 'tier-1000',
          minQty: 1000,
          maxQty: 4999,
          discountPercent: 10,
          offerName: 'Volume Tier Savings (10% OFF)',
          savingsAmount: Math.round(originalBasePrice * 0.10 * dto.quantity * 100) / 100,
        };
      } else if (dto.quantity >= 500) {
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

    // 4. Artwork & Design Service Dynamic Rules
    let artworkFee = 0;
    const artworkReq = product.artworkRequirement || 'OPTIONAL';
    const rawArtworkPrice = Number(product.artworkPrice) || 0;

    if (artworkReq === 'REQUIRED') {
      artworkFee = rawArtworkPrice;
    } else if (artworkReq === 'OPTIONAL' && dto.hasArtwork) {
      artworkFee = rawArtworkPrice;
    }

    let designServiceFee = 0;
    const designReq = product.designServiceRequirement || 'DISABLED';
    const rawDesignPrice = Number(product.designServicePrice) || 0;

    if (designReq === 'REQUIRED') {
      designServiceFee = rawDesignPrice;
    } else if (designReq === 'OPTIONAL' && dto.hasDesignService) {
      designServiceFee = rawDesignPrice;
    }

    const refReq = product.referenceImageRequirement || 'DISABLED';

    // Apply percentage modifiers and calculate total unit price
    let unitPrice = (baseUnitPrice + optionsUnitModifier) * (1 + percentageModifierTotal / 100);
    unitPrice = Math.round(unitPrice * 100) / 100;

    const baseSubtotal = Math.round(originalBasePrice * dto.quantity * 100) / 100;
    const dynamicModifiersTotal = Math.round(optionsUnitModifier * dto.quantity * 100) / 100;
    const discountAmount = appliedOffer ? appliedOffer.savingsAmount : 0;
    const discountPercent = appliedOffer ? appliedOffer.discountPercent : 0;

    const printItemsTotal = Math.round(unitPrice * dto.quantity * 100) / 100;
    const subtotal = Math.round((printItemsTotal + artworkFee + designServiceFee) * 100) / 100;

    // Dynamic Authoritative GST & Shipping Calculation via ShippingGstService
    const deliveryMethod = dto.deliveryMethod || 'COURIER';
    const shipTaxResult = await this.shippingGstService.calculateShippingAndTax(
      subtotal,
      dto.shippingPincode,
      deliveryMethod === 'STORE_PICKUP' ? 'STORE_PICKUP' : 'COURIER',
      dto.isInterState || false,
    );

    const cgst = shipTaxResult.cgst;
    const sgst = shipTaxResult.sgst;
    const igst = shipTaxResult.igst;
    const totalTax = shipTaxResult.gstAmount;
    const estimatedShipping = shipTaxResult.shippingFee;
    const courierRate = shipTaxResult.baseShippingFee;
    const freeShippingThreshold = shipTaxResult.freeShippingThreshold;

    // Cash on Delivery (COD) - Fully Removed / Disabled
    const allowCod = false;
    const codSurcharge = 0;
    const codCharge = 0;
    const paymentMethod = dto.paymentMethod || 'FULL';

    const grandTotal = Math.round((subtotal + totalTax + estimatedShipping) * 100) / 100;

    // Enrich specifications snapshot with flow engine meta
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
}

