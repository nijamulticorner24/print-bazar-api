"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const pricing_service_1 = require("./pricing.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('PricingService (Authoritative Server Pricing Engine)', () => {
    let service;
    const mockProduct = {
        id: 'prod-001',
        name: 'Visiting Cards',
        sku: 'SKU-VC-001',
        pricingModel: 'MATRIX',
        basePrice: 2.0,
        minQuantity: 100,
        maxQuantity: 10000,
        productionDays: 2,
        options: [
            {
                code: 'paper',
                name: 'Paper Stock',
                values: [
                    { code: '350gsm', name: '350 GSM', priceModifierType: 'FIXED', priceModifier: 0.5 },
                ],
            },
        ],
        pricingMatrices: [
            { minQty: 100, maxQty: 500, unitPrice: 2.0, attributeCombination: {} },
            { minQty: 501, maxQty: 2000, unitPrice: 1.6, attributeCombination: {} },
        ],
    };
    const mockPrismaService = {
        product: {
            findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.id === 'prod-001')
                    return Promise.resolve(mockProduct);
                return Promise.resolve(null);
            }),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                pricing_service_1.PricingService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(pricing_service_1.PricingService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should accurately calculate quote with options, tax and shipping', async () => {
        const quote = await service.calculateQuote({
            productId: 'prod-001',
            quantity: 500,
            options: [{ optionCode: 'paper', valueCode: '350gsm' }],
        });
        expect(quote.unitPrice).toBe(2.5);
        expect(quote.subtotal).toBe(1250);
        expect(quote.totalTax).toBe(225);
        expect(quote.estimatedShipping).toBe(0);
        expect(quote.grandTotal).toBe(1475);
    });
    it('should apply volume tiered matrix price reduction for higher quantities', async () => {
        const quote = await service.calculateQuote({
            productId: 'prod-001',
            quantity: 1000,
            options: [{ optionCode: 'paper', valueCode: '350gsm' }],
        });
        expect(quote.unitPrice).toBe(2.1);
        expect(quote.subtotal).toBe(2100);
    });
    it('should reject calculation if requested quantity is below product minimum', async () => {
        await expect(service.calculateQuote({
            productId: 'prod-001',
            quantity: 50,
            options: [],
        })).rejects.toThrow(common_1.BadRequestException);
    });
    it('should throw NotFoundException for invalid product ID', async () => {
        await expect(service.calculateQuote({
            productId: 'non-existent-id',
            quantity: 100,
            options: [],
        })).rejects.toThrow(common_1.NotFoundException);
    });
});
//# sourceMappingURL=pricing.service.spec.js.map