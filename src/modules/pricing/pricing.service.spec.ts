import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ShippingGstService } from '../shipping-gst/shipping-gst.service';

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

  const mockSingleProduct = {
    id: 'prod-single-001',
    name: 'Custom Framed Poster',
    sku: 'SKU-POSTER-001',
    pricingModel: 'SINGLE',
    basePrice: 200.0,
    minQuantity: 1,
    maxQuantity: 20,
    productionDays: 2,
    tags: ['SINGLE_TYPE'],
    pricingMatrices: [
      { minQty: 1, maxQty: 5, unitPrice: 200.0, attributeCombination: { type: 'BASE', isBasePrice: true } },
      { minQty: 6, maxQty: 10, unitPrice: 190.0, attributeCombination: { type: 'BASE', isBasePrice: true } },
      { minQty: 11, maxQty: 20, unitPrice: 180.0, attributeCombination: { type: 'BASE', isBasePrice: true } },
      // Add-on rules
      { minQty: 1, maxQty: 5, unitPrice: 40.0, attributeCombination: { type: 'ATTRIBUTE', attributeCode: 'design', attributeValue: 'yes' } },
      { minQty: 6, maxQty: 10, unitPrice: 35.0, attributeCombination: { type: 'ATTRIBUTE', attributeCode: 'design', attributeValue: 'yes' } },
      { minQty: 11, maxQty: 20, unitPrice: 30.0, attributeCombination: { type: 'ATTRIBUTE', attributeCode: 'design', attributeValue: 'yes' } },
    ],
  };

  const mockPrismaService = {
    product: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.OR?.some((cond: any) => cond.id === 'prod-001' || cond.slug === 'prod-001' || cond.sku === 'prod-001')) {
          return Promise.resolve(mockProduct);
        }
        if (where?.OR?.some((cond: any) => cond.id === 'prod-single-001' || cond.slug === 'prod-single-001' || cond.sku === 'prod-single-001')) {
          return Promise.resolve(mockSingleProduct);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'prod-001') return Promise.resolve(mockProduct);
        if (where.id === 'prod-single-001') return Promise.resolve(mockSingleProduct);
        return Promise.resolve(null);
      }),
    },
    reusableAttribute: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockShippingGstService = {
    calculateShippingAndTax: jest.fn().mockImplementation((subtotal: number) => {
      const gst = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal >= 1000 ? 0 : 100;
      return Promise.resolve({
        cgst: gst / 2,
        sgst: gst / 2,
        igst: 0,
        gstAmount: gst,
        gstRatePercent: 18,
        shippingFee: shipping,
        baseShippingFee: 100,
        freeShippingThreshold: 1000,
        isFreeShippingApplied: subtotal >= 1000,
        appliedCourierZone: null,
      });
    }),
    getSetting: jest.fn().mockResolvedValue({ defaultCourierCharge: 100, freeShippingThreshold: 1000, defaultGstRate: 18 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ShippingGstService, useValue: mockShippingGstService },
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

  describe('Single-Type Quantity Range Pricing', () => {
    it('should calculate correct price for quantity in range 1–5', async () => {
      // Qty 1 -> ₹200 per piece, total ₹200
      const quote1 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 1,
      });
      expect(quote1.unitPrice).toBe(200);
      expect(quote1.subtotal).toBe(200);

      // Qty 5 -> ₹200 per piece, total ₹1,000
      const quote5 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 5,
      });
      expect(quote5.unitPrice).toBe(200);
      expect(quote5.subtotal).toBe(1000);
    });

    it('should calculate correct price for quantity in range 6–10', async () => {
      // Qty 6 -> ₹190 per piece, total ₹1,140
      const quote6 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 6,
      });
      expect(quote6.unitPrice).toBe(190);
      expect(quote6.subtotal).toBe(1140);

      // Qty 10 -> ₹190 per piece, total ₹1,900
      const quote10 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 10,
      });
      expect(quote10.unitPrice).toBe(190);
      expect(quote10.subtotal).toBe(1900);
    });

    it('should calculate correct price for quantity in range 11–20', async () => {
      // Qty 11 -> ₹180 per piece, total ₹1,980
      const quote11 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 11,
      });
      expect(quote11.unitPrice).toBe(180);
      expect(quote11.subtotal).toBe(1980);

      // Qty 20 -> ₹180 per piece, total ₹3,600
      const quote20 = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 20,
      });
      expect(quote20.unitPrice).toBe(180);
      expect(quote20.subtotal).toBe(3600);
    });

    it('should calculate independent add-on prices for each quantity range', async () => {
      // Range 1-5 has Design add-on = ₹40/pc -> Unit price 240, Total for 5 = 1200
      const quote5WithAddon = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 5,
        fieldValues: { design: 'yes' },
      });
      expect(quote5WithAddon.unitPrice).toBe(240);
      expect(quote5WithAddon.subtotal).toBe(1200);

      // Range 6-10 has Design add-on = ₹35/pc -> Unit price 225, Total for 6 = 1350
      const quote6WithAddon = await service.calculateQuote({
        productId: 'prod-single-001',
        quantity: 6,
        fieldValues: { design: 'yes' },
      });
      expect(quote6WithAddon.unitPrice).toBe(225);
      expect(quote6WithAddon.subtotal).toBe(1350);
    });

    it('should reject quantity outside Single Type min/max range', async () => {
      await expect(
        service.calculateQuote({
          productId: 'prod-single-001',
          quantity: 25, // max is 20
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
