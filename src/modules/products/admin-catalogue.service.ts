import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateProductFieldDto,
  UpdateProductFieldDto,
  CreateFieldOptionDto,
  UpdateFieldOptionDto,
  CreateProductImageDto,
  UpdateProductImageDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  RecordStockMovementDto,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  BatchPricingRulesDto,
  ProductStatusDto,
  ProductFieldTypeDto,
} from './dto/catalogue.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminCatalogueService {
  private readonly logger = new Logger(AdminCatalogueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // CATEGORIES MANAGEMENT
  // ==========================================

  async listCategories() {
    return this.prisma.productCategory.findMany({
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
  }

  async getCategoryById(id: string) {
    const cat = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            status: true,
            basePrice: true,
          },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });
    if (!cat) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return cat;
  }

  async createCategory(dto: CreateCategoryDto, actorId?: string) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Category slug '${dto.slug}' already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID '${dto.parentId}' not found`);
      }
    }

    const category = await this.prisma.productCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'CATEGORY_CREATED',
      entity: 'ProductCategory',
      entityId: category.id,
      newState: category,
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorId?: string) {
    const current = await this.getCategoryById(id);

    if (dto.slug && dto.slug !== current.slug) {
      const existing = await this.prisma.productCategory.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Category slug '${dto.slug}' already exists`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID '${dto.parentId}' not found`);
      }
    }

    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId !== undefined ? (dto.parentId || null) : undefined,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
        _count: { select: { products: true, children: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'CATEGORY_UPDATED',
      entity: 'ProductCategory',
      entityId: id,
      previousState: current,
      newState: updated,
    });

    return updated;
  }

  async deleteCategory(id: string, actorId?: string) {
    const category = await this.getCategoryById(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category '${category.name}' because it contains ${productCount} products. Reassign or delete products first.`,
      );
    }

    const subcategoryCount = await this.prisma.productCategory.count({
      where: { parentId: id },
    });
    if (subcategoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete category '${category.name}' because it has ${subcategoryCount} subcategories. Delete or move the subcategories first.`,
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'CATEGORY_DELETED',
      entity: 'ProductCategory',
      entityId: id,
      previousState: category,
    });

    return { success: true, message: `Category '${category.name}' deleted successfully` };
  }

  // ==========================================
  // PRODUCTS MANAGEMENT
  // ==========================================

  async listProducts(query: {
    categoryId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          fields: {
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
        skip,
        take: limit,
      }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        fields: {
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        pricingMatrices: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return product;
  }

  async createProduct(dto: CreateProductDto, actorId?: string) {
    // 1. Verify Category exists
    const category = await this.prisma.productCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${dto.categoryId}' not found`);
    }

    // 2. Verify unique slug and SKU
    const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException(`Product slug '${dto.slug}' already in use`);
    }

    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException(`Product SKU '${dto.sku}' already in use`);
    }

    // 3. Create Product with initial Images and Fields in a single transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug: dto.slug,
          sku: dto.sku,
          description: dto.description,
          status: (dto.status as any) || ProductStatusDto.DRAFT,
          pricingModel: dto.pricingModel || 'MATRIX',
          basePrice: dto.basePrice,
          minQuantity: dto.minQuantity || 1,
          quantityStep: dto.quantityStep !== undefined ? dto.quantityStep : 100,
          maxQuantity: dto.maxQuantity || 100000,
          productionDays: dto.productionDays || 2,
          sortOrder: dto.sortOrder || 0,
          isFeatured: dto.isFeatured ?? false,
          tags: dto.tags || [],
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          trackInventory: dto.trackInventory ?? false,
          stockQuantity: dto.stockQuantity || 0,
          lowStockAlert: dto.lowStockAlert || 10,
          defaultSize: dto.defaultSize,
          artworkRequirement: (dto.artworkRequirement as any) || 'OPTIONAL',
          artworkPrice: dto.artworkPrice !== undefined ? dto.artworkPrice : 0,
          artworkQualityVerification: dto.artworkQualityVerification ?? true,
          minimumArtworkMegapixels: dto.minimumArtworkMegapixels !== undefined ? dto.minimumArtworkMegapixels : 1.0,
          referenceImageRequirement: (dto.referenceImageRequirement as any) || 'DISABLED',
          designServiceRequirement: (dto.designServiceRequirement as any) || 'DISABLED',
          designServicePrice: dto.designServicePrice !== undefined ? dto.designServicePrice : 0,
          courierCharge: dto.courierCharge !== undefined ? dto.courierCharge : 100,
          freeShippingThreshold: dto.freeShippingThreshold !== undefined ? dto.freeShippingThreshold : 1000,
          allowCod: dto.allowCod !== undefined ? dto.allowCod : true,
          codSurcharge: dto.codSurcharge !== undefined ? dto.codSurcharge : 50,
        } as any,
      });

      // Add Images if provided
      if (dto.images && dto.images.length > 0) {
        for (let i = 0; i < dto.images.length; i++) {
          const img = dto.images[i];
          await tx.productImage.create({
            data: {
              productId: created.id,
              url: img.url,
              storageKey: img.storageKey,
              altText: img.altText || created.name,
              caption: img.caption,
              sortOrder: img.sortOrder ?? i,
              isPrimary: img.isPrimary ?? i === 0,
            },
          });
        }
      }

      // Add Dynamic Fields if provided
      if (dto.fields && dto.fields.length > 0) {
        for (let i = 0; i < dto.fields.length; i++) {
          const f = dto.fields[i];
          const fieldRecord = await tx.productField.create({
            data: {
              productId: created.id,
              label: f.label,
              key: f.key,
              type: (f.type as any) || ProductFieldTypeDto.SELECT,
              description: f.description,
              placeholder: f.placeholder,
              defaultValue: f.defaultValue,
              isRequired: f.isRequired ?? true,
              isCustomerVisible: f.isCustomerVisible ?? true,
              isCustomerEditable: f.isCustomerEditable ?? true,
              sortOrder: f.sortOrder ?? i,
              validationRules: f.validationRules as any,
              conditionalLogic: f.conditionalLogic as any,
            },
          });

          // Options for select/radio/checkbox
          if (f.options && f.options.length > 0) {
            for (let j = 0; j < f.options.length; j++) {
              const opt = f.options[j];
              await tx.productFieldOption.create({
                data: {
                  fieldId: fieldRecord.id,
                  label: opt.label,
                  value: opt.value,
                  priceModifierType: opt.priceModifierType || 'FIXED',
                  priceModifier: opt.priceModifier || 0,
                  sortOrder: opt.sortOrder ?? j,
                  isDefault: opt.isDefault ?? j === 0,
                  isActive: opt.isActive ?? true,
                },
              });
            }
          }
        }
      }

      return created;
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      newState: product,
    });

    return this.getProductById(product.id);
  }

  async updateProduct(id: string, dto: UpdateProductDto, actorId?: string) {
    const current = await this.getProductById(id);

    if (dto.slug && dto.slug !== current.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`Product slug '${dto.slug}' already exists`);
      }
    }

    if (dto.sku && dto.sku !== current.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existing) {
        throw new ConflictException(`Product SKU '${dto.sku}' already exists`);
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        sku: dto.sku,
        description: dto.description,
        status: dto.status as any,
        pricingModel: dto.pricingModel,
        basePrice: dto.basePrice,
        minQuantity: dto.minQuantity,
        quantityStep: dto.quantityStep,
        maxQuantity: dto.maxQuantity,
        productionDays: dto.productionDays,
        sortOrder: dto.sortOrder,
        isFeatured: dto.isFeatured,
        tags: dto.tags,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        trackInventory: dto.trackInventory,
        stockQuantity: dto.stockQuantity,
        lowStockAlert: dto.lowStockAlert,
        defaultSize: dto.defaultSize,
        isActive: dto.isActive,
        artworkRequirement: dto.artworkRequirement as any,
        artworkPrice: dto.artworkPrice,
        artworkQualityVerification: dto.artworkQualityVerification,
        minimumArtworkMegapixels: dto.minimumArtworkMegapixels,
        referenceImageRequirement: dto.referenceImageRequirement as any,
        designServiceRequirement: dto.designServiceRequirement as any,
        designServicePrice: dto.designServicePrice,
        courierCharge: dto.courierCharge,
        freeShippingThreshold: dto.freeShippingThreshold,
        allowCod: dto.allowCod,
        codSurcharge: dto.codSurcharge,
      } as any,
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      previousState: current,
      newState: updated,
    });

    return this.getProductById(id);
  }

  async duplicateProduct(id: string, actorId?: string) {
    const source = await this.getProductById(id);
    const timestamp = Date.now().toString().slice(-4);
    const newSku = `${source.sku}-COPY-${timestamp}`;
    const newSlug = `${source.slug}-copy-${timestamp}`;
    const newName = `${source.name} (Copy)`;

    const duplicated = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          categoryId: source.categoryId,
          name: newName,
          slug: newSlug,
          sku: newSku,
          description: source.description,
          status: ProductStatusDto.DRAFT as any,
          pricingModel: source.pricingModel,
          basePrice: source.basePrice,
          minQuantity: source.minQuantity,
          maxQuantity: source.maxQuantity,
          productionDays: source.productionDays,
          sortOrder: (source.sortOrder || 0) + 1,
          isFeatured: false,
          tags: source.tags,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          artworkRequirement: source.artworkRequirement,
          artworkPrice: source.artworkPrice,
          artworkQualityVerification: source.artworkQualityVerification,
          minimumArtworkMegapixels: source.minimumArtworkMegapixels,
          referenceImageRequirement: source.referenceImageRequirement,
          designServiceRequirement: source.designServiceRequirement,
          designServicePrice: source.designServicePrice,
        },
      });

      // Duplicate Images
      for (const img of source.images) {
        await tx.productImage.create({
          data: {
            productId: created.id,
            url: img.url,
            storageKey: img.storageKey,
            altText: img.altText,
            caption: img.caption,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          },
        });
      }

      // Duplicate Fields & Options
      for (const f of source.fields) {
        const field = await tx.productField.create({
          data: {
            productId: created.id,
            label: f.label,
            key: f.key,
            type: f.type,
            description: f.description,
            placeholder: f.placeholder,
            defaultValue: f.defaultValue,
            isRequired: f.isRequired,
            isCustomerVisible: f.isCustomerVisible,
            isCustomerEditable: f.isCustomerEditable,
            sortOrder: f.sortOrder,
            validationRules: f.validationRules as any,
            conditionalLogic: f.conditionalLogic as any,
          },
        });

        for (const opt of f.options) {
          await tx.productFieldOption.create({
            data: {
              fieldId: field.id,
              label: opt.label,
              value: opt.value,
              priceModifierType: opt.priceModifierType,
              priceModifier: opt.priceModifier,
              sortOrder: opt.sortOrder,
              isDefault: opt.isDefault,
              isActive: opt.isActive,
            },
          });
        }
      }

      return created;
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_DUPLICATED',
      entity: 'Product',
      entityId: duplicated.id,
      newState: duplicated,
      reason: `Cloned from product ID: ${id}`,
    });

    return this.getProductById(duplicated.id);
  }

  async publishProduct(id: string, actorId?: string) {
    const product = await this.getProductById(id);

    // Strict pre-publish validation checks
    const errors: string[] = [];

    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required.');
    }
    if (!product.categoryId) {
      errors.push('Product must belong to a valid category.');
    }
    if (Number(product.basePrice) < 0) {
      errors.push('Base price cannot be negative.');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Cannot publish product due to validation failures',
        errors,
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatusDto.PUBLISHED as any,
        isActive: true,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_PUBLISHED',
      entity: 'Product',
      entityId: id,
      previousState: { status: product.status },
      newState: { status: ProductStatusDto.PUBLISHED },
    });

    return updated;
  }

  async archiveProduct(id: string, actorId?: string) {
    const product = await this.getProductById(id);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatusDto.ARCHIVED as any,
        isActive: false,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_ARCHIVED',
      entity: 'Product',
      entityId: id,
      previousState: { status: product.status },
      newState: { status: ProductStatusDto.ARCHIVED },
    });

    return updated;
  }

  async deleteProduct(id: string, actorId?: string) {
    const product = await this.getProductById(id);

    // Check if product has historical orders
    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      // Archive instead to preserve historical integrity
      return this.archiveProduct(id, actorId);
    }

    await this.prisma.product.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
      previousState: product,
    });

    return { success: true, message: `Product '${product.name}' deleted successfully` };
  }

  // ==========================================
  // DYNAMIC FIELDS MANAGEMENT
  // ==========================================

  async addField(productId: string, dto: CreateProductFieldDto, actorId?: string) {
    const product = await this.getProductById(productId);

    // Check unique key per product
    const existing = await this.prisma.productField.findUnique({
      where: {
        productId_key: {
          productId,
          key: dto.key,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Field key '${dto.key}' already exists for this product`);
    }

    const field = await this.prisma.$transaction(async (tx) => {
      const createdField = await tx.productField.create({
        data: {
          productId,
          label: dto.label,
          key: dto.key,
          type: (dto.type as any) || ProductFieldTypeDto.SELECT,
          description: dto.description,
          placeholder: dto.placeholder,
          defaultValue: dto.defaultValue,
          isRequired: dto.isRequired ?? true,
          isCustomerVisible: dto.isCustomerVisible ?? true,
          isCustomerEditable: dto.isCustomerEditable ?? true,
          sortOrder: dto.sortOrder ?? 0,
          validationRules: dto.validationRules as any,
          conditionalLogic: dto.conditionalLogic as any,
        },
      });

      if (dto.options && dto.options.length > 0) {
        for (let i = 0; i < dto.options.length; i++) {
          const opt = dto.options[i];
          await tx.productFieldOption.create({
            data: {
              fieldId: createdField.id,
              label: opt.label,
              value: opt.value,
              priceModifierType: opt.priceModifierType || 'FIXED',
              priceModifier: opt.priceModifier || 0,
              sortOrder: opt.sortOrder ?? i,
              isDefault: opt.isDefault ?? i === 0,
              isActive: opt.isActive ?? true,
            },
          });
        }
      }

      return createdField;
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_FIELD_CREATED',
      entity: 'ProductField',
      entityId: field.id,
      newState: field,
    });

    return this.prisma.productField.findUnique({
      where: { id: field.id },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async updateField(fieldId: string, dto: UpdateProductFieldDto, actorId?: string) {
    const current = await this.prisma.productField.findUnique({
      where: { id: fieldId },
    });
    if (!current) {
      throw new NotFoundException(`Product field with ID '${fieldId}' not found`);
    }

    const updated = await this.prisma.productField.update({
      where: { id: fieldId },
      data: {
        label: dto.label,
        type: dto.type as any,
        description: dto.description,
        placeholder: dto.placeholder,
        defaultValue: dto.defaultValue,
        isRequired: dto.isRequired,
        isCustomerVisible: dto.isCustomerVisible,
        isCustomerEditable: dto.isCustomerEditable,
        sortOrder: dto.sortOrder,
        validationRules: dto.validationRules as any,
        conditionalLogic: dto.conditionalLogic as any,
      },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_FIELD_UPDATED',
      entity: 'ProductField',
      entityId: fieldId,
      previousState: current,
      newState: updated,
    });

    return updated;
  }

  async deleteField(fieldId: string, actorId?: string) {
    const field = await this.prisma.productField.findUnique({
      where: { id: fieldId },
    });
    if (!field) {
      throw new NotFoundException(`Product field with ID '${fieldId}' not found`);
    }

    await this.prisma.productField.delete({ where: { id: fieldId } });

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_FIELD_DELETED',
      entity: 'ProductField',
      entityId: fieldId,
      previousState: field,
    });

    return { success: true, message: `Field '${field.label}' deleted successfully` };
  }

  async addFieldOption(fieldId: string, dto: CreateFieldOptionDto, actorId?: string) {
    const field = await this.prisma.productField.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundException(`Field with ID '${fieldId}' not found`);
    }

    const option = await this.prisma.productFieldOption.create({
      data: {
        fieldId,
        label: dto.label,
        value: dto.value,
        priceModifierType: dto.priceModifierType || 'FIXED',
        priceModifier: dto.priceModifier || 0,
        sortOrder: dto.sortOrder ?? 0,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'FIELD_OPTION_CREATED',
      entity: 'ProductFieldOption',
      entityId: option.id,
      newState: option,
    });

    return option;
  }

  async updateFieldOption(optionId: string, dto: UpdateFieldOptionDto, actorId?: string) {
    const current = await this.prisma.productFieldOption.findUnique({
      where: { id: optionId },
    });
    if (!current) {
      throw new NotFoundException(`Option with ID '${optionId}' not found`);
    }

    const updated = await this.prisma.productFieldOption.update({
      where: { id: optionId },
      data: {
        label: dto.label,
        value: dto.value,
        priceModifierType: dto.priceModifierType,
        priceModifier: dto.priceModifier,
        sortOrder: dto.sortOrder,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'FIELD_OPTION_UPDATED',
      entity: 'ProductFieldOption',
      entityId: optionId,
      previousState: current,
      newState: updated,
    });

    return updated;
  }

  async deleteFieldOption(optionId: string, actorId?: string) {
    const option = await this.prisma.productFieldOption.findUnique({
      where: { id: optionId },
    });
    if (!option) {
      throw new NotFoundException(`Option with ID '${optionId}' not found`);
    }

    await this.prisma.productFieldOption.delete({ where: { id: optionId } });

    await this.auditService.log({
      actorId,
      action: 'FIELD_OPTION_DELETED',
      entity: 'ProductFieldOption',
      entityId: optionId,
      previousState: option,
    });

    return { success: true, message: `Option '${option.label}' deleted successfully` };
  }

  // ==========================================
  // PRODUCT IMAGES MANAGEMENT & UPLOADS
  // ==========================================

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
    metadata?: { altText?: string; caption?: string; isPrimary?: boolean },
    actorId?: string,
  ) {
    const product = await this.getProductById(productId);
    const relativeUrl = `/uploads/products/${file.filename}`;

    return this.prisma.$transaction(async (tx) => {
      if (metadata?.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      const count = await tx.productImage.count({ where: { productId } });
      const isPrimary = metadata?.isPrimary || count === 0;

      const image = await tx.productImage.create({
        data: {
          productId,
          url: relativeUrl,
          storageKey: file.filename,
          altText: metadata?.altText || product.name,
          caption: metadata?.caption,
          sortOrder: count,
          isPrimary,
        },
      });

      await this.auditService.log({
        actorId,
        action: 'PRODUCT_IMAGE_UPLOADED',
        entity: 'ProductImage',
        entityId: image.id,
        newState: image,
      });

      return image;
    });
  }

  async addProductImage(productId: string, dto: CreateProductImageDto, actorId?: string) {
    const product = await this.getProductById(productId);

    return this.prisma.$transaction(async (tx) => {
      // If setting as primary, unset other primaries
      if (dto.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      // If this is the first image, make it primary automatically
      const count = await tx.productImage.count({ where: { productId } });
      const isPrimary = dto.isPrimary || count === 0;

      const image = await tx.productImage.create({
        data: {
          productId,
          url: dto.url,
          storageKey: dto.storageKey,
          altText: dto.altText || product.name,
          caption: dto.caption,
          sortOrder: dto.sortOrder ?? count,
          isPrimary,
        },
      });

      await this.auditService.log({
        actorId,
        action: 'PRODUCT_IMAGE_ADDED',
        entity: 'ProductImage',
        entityId: image.id,
        newState: image,
      });

      return image;
    });
  }

  async setPrimaryImage(productId: string, imageId: string, actorId?: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw new NotFoundException(`Image with ID '${imageId}' not found on this product`);
    }

    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    await this.auditService.log({
      actorId,
      action: 'PRIMARY_IMAGE_SET',
      entity: 'ProductImage',
      entityId: imageId,
      reason: `Set as primary image for product ${productId}`,
    });

    return { success: true, message: 'Primary image updated' };
  }

  async deleteProductImage(productId: string, imageId: string, actorId?: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw new NotFoundException(`Image not found on product`);
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    // If deleted was primary, set the next image as primary if exists
    if (image.isPrimary) {
      const nextImg = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (nextImg) {
        await this.prisma.productImage.update({
          where: { id: nextImg.id },
          data: { isPrimary: true },
        });
      }
    }

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_IMAGE_DELETED',
      entity: 'ProductImage',
      entityId: imageId,
      previousState: image,
    });

    return { success: true, message: 'Image deleted successfully' };
  }

  async reorderImages(productId: string, orderedImageIds: string[], actorId?: string) {
    await this.prisma.$transaction(
      orderedImageIds.map((id, index) =>
        this.prisma.productImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'PRODUCT_IMAGES_REORDERED',
      entity: 'Product',
      entityId: productId,
    });

    return { success: true, message: 'Image ordering updated' };
  }

  // ==========================================
  // INVENTORY & RAW MATERIALS MANAGEMENT
  // ==========================================

  async listInventoryItems(query?: { category?: string; search?: string; lowStockOnly?: boolean }) {
    const where: Prisma.InventoryItemWhereInput = {
      ...(query?.category ? { category: query.category as any } : {}),
      ...(query?.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        movements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (query?.lowStockOnly) {
      return items.filter((item) => Number(item.currentStock) <= Number(item.minStockThreshold));
    }

    return items;
  }

  async createInventoryItem(dto: CreateInventoryItemDto, actorId?: string) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`Inventory SKU '${dto.sku}' already exists`);
    }

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          category: dto.category as any,
          unit: dto.unit,
          currentStock: dto.currentStock,
          minStockThreshold: dto.minStockThreshold || 100,
          costPerUnit: dto.costPerUnit || 0,
          location: dto.location,
          notes: dto.notes,
        },
      });

      // Initial Stock In Movement
      if (dto.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            inventoryItemId: created.id,
            type: 'STOCK_IN',
            quantity: dto.currentStock,
            balanceAfter: dto.currentStock,
            referenceType: 'INITIAL_COUNT',
            notes: 'Initial inventory setup',
            performedById: actorId,
          },
        });
      }

      return created;
    });

    await this.auditService.log({
      actorId,
      action: 'INVENTORY_ITEM_CREATED',
      entity: 'InventoryItem',
      entityId: item.id,
      newState: item,
    });

    return item;
  }

  async updateInventoryItem(id: string, dto: UpdateInventoryItemDto, actorId?: string) {
    const current = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Inventory item with ID '${id}' not found`);
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        category: dto.category as any,
        unit: dto.unit,
        minStockThreshold: dto.minStockThreshold,
        costPerUnit: dto.costPerUnit,
        location: dto.location,
        notes: dto.notes,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'INVENTORY_ITEM_UPDATED',
      entity: 'InventoryItem',
      entityId: id,
      previousState: current,
      newState: updated,
    });

    return updated;
  }

  async recordStockMovement(itemId: string, dto: RecordStockMovementDto, actorId?: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID '${itemId}' not found`);
    }

    const currentQty = Number(item.currentStock);
    const movementQty = Number(dto.quantity);
    let newBalance = currentQty;

    if (dto.type === 'STOCK_IN' || dto.type === 'RETURN') {
      newBalance = currentQty + movementQty;
    } else if (dto.type === 'CONSUMPTION' || dto.type === 'RELEASE') {
      if (currentQty < movementQty) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${currentQty} ${item.unit}, Requested: ${movementQty} ${item.unit}`,
        );
      }
      newBalance = currentQty - movementQty;
    } else if (dto.type === 'ADJUSTMENT') {
      newBalance = movementQty; // absolute adjustment
    }

    const movement = await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: newBalance },
      });

      return tx.stockMovement.create({
        data: {
          inventoryItemId: itemId,
          type: dto.type as any,
          quantity: movementQty,
          balanceAfter: newBalance,
          referenceType: dto.referenceType || 'MANUAL_AUDIT',
          referenceId: dto.referenceId,
          notes: dto.notes,
          performedById: actorId,
        },
      });
    });

    await this.auditService.log({
      actorId,
      action: 'STOCK_MOVEMENT_RECORDED',
      entity: 'StockMovement',
      entityId: movement.id,
      newState: {
        type: dto.type,
        quantity: movementQty,
        previousBalance: currentQty,
        newBalance,
      },
    });

    return {
      movement,
      item: await this.prisma.inventoryItem.findUnique({ where: { id: itemId } }),
    };
  }

  async listStockMovements(itemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        ...(itemId ? { inventoryItemId: itemId } : {}),
      },
      include: {
        inventoryItem: { select: { id: true, name: true, sku: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ==========================================
  // PRICING RULES / QUANTITY TIER OFFERS
  // ==========================================

  async listPricingRules(productId: string) {
    await this.getProductById(productId);
    return this.prisma.pricingMatrix.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
    });
  }

  async addPricingRule(productId: string, dto: CreatePricingRuleDto, actorId?: string) {
    const product = await this.getProductById(productId);
    const base = Number(product.basePrice);

    let unitPrice = dto.unitPrice;
    if (dto.discountPercent !== undefined && (!unitPrice || unitPrice <= 0)) {
      unitPrice = Math.round(base * (1 - dto.discountPercent / 100) * 10000) / 10000;
    }
    if (!unitPrice || unitPrice <= 0) {
      unitPrice = base;
    }

    const combo = {
      ...(dto.attributeCombination || {}),
      discountPercent: dto.discountPercent,
      label: dto.label || (dto.discountPercent ? `${dto.discountPercent}% Volume Offer` : undefined),
    };

    const rule = await this.prisma.pricingMatrix.create({
      data: {
        productId,
        minQty: dto.minQty,
        maxQty: dto.maxQty,
        unitPrice: new Prisma.Decimal(unitPrice),
        attributeCombination: combo,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'PRICING_RULE_CREATED',
      entity: 'PricingMatrix',
      entityId: rule.id,
      newState: rule,
    });

    return rule;
  }

  async updatePricingRule(ruleId: string, dto: UpdatePricingRuleDto, actorId?: string) {
    const current = await this.prisma.pricingMatrix.findUnique({ where: { id: ruleId } });
    if (!current) {
      throw new NotFoundException(`Pricing rule with ID '${ruleId}' not found`);
    }

    const product = await this.getProductById(current.productId);
    const base = Number(product.basePrice);

    let unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : Number(current.unitPrice);
    if (dto.discountPercent !== undefined && (!dto.unitPrice || dto.unitPrice <= 0)) {
      unitPrice = Math.round(base * (1 - dto.discountPercent / 100) * 10000) / 10000;
    }

    const currentCombo = (current.attributeCombination as any) || {};
    const combo = {
      ...currentCombo,
      ...(dto.attributeCombination || {}),
      ...(dto.discountPercent !== undefined ? { discountPercent: dto.discountPercent } : {}),
      ...(dto.label !== undefined ? { label: dto.label } : {}),
    };

    const updated = await this.prisma.pricingMatrix.update({
      where: { id: ruleId },
      data: {
        ...(dto.minQty !== undefined ? { minQty: dto.minQty } : {}),
        ...(dto.maxQty !== undefined ? { maxQty: dto.maxQty } : {}),
        unitPrice: new Prisma.Decimal(unitPrice),
        attributeCombination: combo,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'PRICING_RULE_UPDATED',
      entity: 'PricingMatrix',
      entityId: ruleId,
      previousState: current,
      newState: updated,
    });

    return updated;
  }

  async deletePricingRule(ruleId: string, actorId?: string) {
    const current = await this.prisma.pricingMatrix.findUnique({ where: { id: ruleId } });
    if (!current) {
      throw new NotFoundException(`Pricing rule with ID '${ruleId}' not found`);
    }

    await this.prisma.pricingMatrix.delete({ where: { id: ruleId } });

    await this.auditService.log({
      actorId,
      action: 'PRICING_RULE_DELETED',
      entity: 'PricingMatrix',
      entityId: ruleId,
      previousState: current,
    });

    return { success: true, message: 'Pricing rule deleted successfully' };
  }

  async saveBatchPricingRules(productId: string, dto: BatchPricingRulesDto, actorId?: string) {
    const product = await this.getProductById(productId);
    const base = Number(product.basePrice);

    return this.prisma.$transaction(async (tx) => {
      // 1. Remove existing pricing matrices for this product
      await tx.pricingMatrix.deleteMany({ where: { productId } });

      // 2. Insert new pricing matrices
      if (dto.rules && dto.rules.length > 0) {
        for (const r of dto.rules) {
          let unitPrice = r.unitPrice;
          if (r.discountPercent !== undefined && (!unitPrice || unitPrice <= 0)) {
            unitPrice = Math.round(base * (1 - r.discountPercent / 100) * 10000) / 10000;
          }
          if (!unitPrice || unitPrice <= 0) {
            unitPrice = base;
          }

          const combo = {
            ...(r.attributeCombination || {}),
            discountPercent: r.discountPercent,
            label: r.label || (r.discountPercent ? `${r.discountPercent}% Volume Offer` : undefined),
          };

          await tx.pricingMatrix.create({
            data: {
              productId,
              minQty: r.minQty,
              maxQty: r.maxQty,
              unitPrice: new Prisma.Decimal(unitPrice),
              attributeCombination: combo,
            },
          });
        }
      }

      const updatedRules = await tx.pricingMatrix.findMany({
        where: { productId },
        orderBy: { minQty: 'asc' },
      });

      return updatedRules;
    });
  }
}

