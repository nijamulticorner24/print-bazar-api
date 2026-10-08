import { PrismaService } from '../prisma/prisma.service';
export interface OptionSelectionDto {
    optionCode: string;
    valueCode: string;
}
export interface QuoteCalculationRequestDto {
    productId: string;
    quantity: number;
    options?: OptionSelectionDto[];
    fieldValues?: Record<string, any>;
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
export declare class PricingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculateQuote(dto: QuoteCalculationRequestDto): Promise<QuoteItemBreakdown>;
}
