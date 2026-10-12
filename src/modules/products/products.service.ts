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

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
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
      throw new NotFoundException(`Product with slug '${slug}' not found or is currently unavailable`);
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
