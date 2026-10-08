import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}

export interface QuoteItemBreakdown {
  basePrice: number;
  quantity: number;
  optionsCost: number;
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
  estimatedShipping: number;
  grandTotal: number;
  productionDays: number;
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
  constructor(private readonly prisma: PrismaService) {}

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
        pricingMatrices: true,
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
          pricingMatrices: true,
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

    // 3. Matrix & Tier Pricing Calculation
    let baseUnitPrice = Number(product.basePrice);

    if (product.pricingModel === 'MATRIX' && product.pricingMatrices.length > 0) {
      const matchingMatrix = product.pricingMatrices.find(
        (m) => dto.quantity >= m.minQty && dto.quantity <= m.maxQty,
      );
      if (matchingMatrix) {
        baseUnitPrice = Number(matchingMatrix.unitPrice);
      }
    } else if (product.pricingModel === 'TIERED') {
      if (dto.quantity >= 5000) baseUnitPrice *= 0.82;
      else if (dto.quantity >= 1000) baseUnitPrice *= 0.90;
      else if (dto.quantity >= 500) baseUnitPrice *= 0.95;
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

    const printItemsTotal = Math.round(unitPrice * dto.quantity * 100) / 100;
    const subtotal = Math.round((printItemsTotal + artworkFee + designServiceFee) * 100) / 100;

    // Standard Print Tariff GST in India = 18% (9% CGST + 9% SGST or 18% IGST)
    const taxRate = 0.18;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (dto.isInterState) {
      igst = Math.round(subtotal * taxRate * 100) / 100;
    } else {
      cgst = Math.round((subtotal * (taxRate / 2)) * 100) / 100;
      sgst = Math.round((subtotal * (taxRate / 2)) * 100) / 100;
    }
    const totalTax = igst > 0 ? igst : cgst + sgst;

    // Shipping calculation: Free above 1000 INR
    const estimatedShipping = subtotal >= 1000 ? 0 : 100;
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

    return {
      basePrice: Number(product.basePrice),
      quantity: dto.quantity,
      optionsCost: Math.round(optionsUnitModifier * dto.quantity * 100) / 100,
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
      estimatedShipping,
      grandTotal,
      productionDays: product.productionDays,
      selectedOptionsSummary,
      specificationsSnapshot,
    };
  }
}
