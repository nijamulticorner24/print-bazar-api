import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(categoryId?: string, search?: string) {
    let categoryCondition: any = undefined;
    if (categoryId) {
      categoryCondition = { categoryId };
    }

    const where: any = {
      isActive: true,
      status: 'PUBLISHED',
      ...(categoryCondition || {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { tags: { has: search } },
            ],
          }
        : {}),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        category: {
          include: {
            parent: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        fields: {
          where: { isCustomerVisible: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getProductBySlug(slugOrId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId },
        ],
        status: 'PUBLISHED',
        isActive: true,
      },
      include: {
        category: {
          include: {
            parent: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        fields: {
          where: { isCustomerVisible: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        pricingMatrices: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug or ID '${slugOrId}' not found or is currently unavailable`);
    }

    // Enrich fields/options with ReusableAttribute metadata (such as fileCount, fileSlotLabels, imageUrl)
    if (product.fields && product.fields.length > 0) {
      const reusableAttrs = await (this.prisma as any).reusableAttribute.findMany({
        where: { isActive: true },
      });
      const attrMap = new Map<string, any>(reusableAttrs.map((a: any) => [a.code, a]));

      for (const field of product.fields) {
        const reusable = attrMap.get(field.key);
        const reusableOptions = (reusable?.options as any[]) || [];
        const optMetaMap = new Map<string, any>(reusableOptions.map((o: any) => [o.value, o]));

        const fieldValRules = (field.validationRules as any) || {};
        const savedOptionConfigs = fieldValRules.optionConfigs || {};

        for (const opt of field.options) {
          const meta = optMetaMap.get(opt.value) || savedOptionConfigs[opt.value] || {};
          if (meta.fileCount !== undefined) {
            (opt as any).fileCount = Number(meta.fileCount);
          }
          if (meta.fileSlotLabels !== undefined) {
            (opt as any).fileSlotLabels = meta.fileSlotLabels;
          }
          if (meta.imageUrl !== undefined) {
            (opt as any).imageUrl = meta.imageUrl;
          }
        }
      }
    }

    return product;
  }

  async listCategories() {
    return this.prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'PUBLISHED', isActive: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
  }
}
