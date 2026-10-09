import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PricingService (Authoritative Server Pricing Engine)', () => {
  let service: PricingService;

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
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.OR?.some((cond: any) => cond.id === 'prod-001' || cond.slug === 'prod-001' || cond.sku === 'prod-001')) {
          return Promise.resolve(mockProduct);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'prod-001') return Promise.resolve(mockProduct);
        return Promise.resolve(null);
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
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

    // Unit price = 2.0 (matrix) + 0.5 (option) = 2.5
    expect(quote.unitPrice).toBe(2.5);
    // Subtotal = 500 * 2.5 = 1250
    expect(quote.subtotal).toBe(1250);
    // GST = 18% of 1250 = 225
    expect(quote.totalTax).toBe(225);
    // Shipping: Free above 1000 INR
    expect(quote.estimatedShipping).toBe(0);
    // Grand Total = 1250 + 225 = 1475
    expect(quote.grandTotal).toBe(1475);
  });

  it('should apply volume tiered matrix price reduction for higher quantities', async () => {
    const quote = await service.calculateQuote({
      productId: 'prod-001',
      quantity: 1000,
      options: [{ optionCode: 'paper', valueCode: '350gsm' }],
    });

    // Unit price = 1.6 (matrix) + 0.5 (option) = 2.1
    expect(quote.unitPrice).toBe(2.1);
    expect(quote.subtotal).toBe(2100);
  });

  it('should reject calculation if requested quantity is below product minimum', async () => {
    await expect(
      service.calculateQuote({
        productId: 'prod-001',
        quantity: 50, // Min is 100
        options: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for invalid product ID', async () => {
    await expect(
      service.calculateQuote({
        productId: 'non-existent-id',
        quantity: 100,
        options: [],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
