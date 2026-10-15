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
var AdminCatalogueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCatalogueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const catalogue_dto_1 = require("./dto/catalogue.dto");
const client_1 = require("@prisma/client");
let AdminCatalogueService = AdminCatalogueService_1 = class AdminCatalogueService {
    prisma;
    auditService;
    logger = new common_1.Logger(AdminCatalogueService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listCategories() {
        return this.prisma.productCategory.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }
    async getCategoryById(id) {
        const cat = await this.prisma.productCategory.findUnique({
            where: { id },
            include: {
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
                    select: { products: true },
                },
            },
        });
        if (!cat) {
            throw new common_1.NotFoundException(`Category with ID '${id}' not found`);
        }
        return cat;
    }
    async createCategory(dto, actorId) {
        const existing = await this.prisma.productCategory.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Category slug '${dto.slug}' already exists`);
        }
        const category = await this.prisma.productCategory.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                image: dto.image,
                parentId: null,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
            include: {
                _count: { select: { products: true } },
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
    async updateCategory(id, dto, actorId) {
        const current = await this.getCategoryById(id);
        if (dto.slug && dto.slug !== current.slug) {
            const existing = await this.prisma.productCategory.findUnique({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new common_1.ConflictException(`Category slug '${dto.slug}' already exists`);
            }
        }
        const updated = await this.prisma.productCategory.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                image: dto.image,
                parentId: null,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
            },
            include: {
                _count: { select: { products: true } },
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
    async deleteCategory(id, actorId) {
        const category = await this.getCategoryById(id);
        const productCount = await this.prisma.product.count({
            where: { categoryId: id },
        });
        if (productCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete category '${category.name}' because it contains ${productCount} products. Reassign or delete products first.`);
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
    async listProducts(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.categoryId ? { categoryId: query.categoryId } : {}),
            ...(query.status ? { status: query.status } : {}),
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
    async getProductById(id) {
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
            throw new common_1.NotFoundException(`Product with ID '${id}' not found`);
        }
        if (product.fields && product.fields.length > 0) {
            const reusableAttrs = await this.prisma.reusableAttribute.findMany({
                where: { isActive: true },
            });
            const attrMap = new Map(reusableAttrs.map((a) => [a.code, a]));
            for (const field of product.fields) {
                const reusable = attrMap.get(field.key);
                const reusableOptions = reusable?.options || [];
                const optMetaMap = new Map(reusableOptions.map((o) => [o.value, o]));
                const fieldValRules = field.validationRules || {};
                const savedOptionConfigs = fieldValRules.optionConfigs || {};
                for (const opt of field.options) {
                    const meta = optMetaMap.get(opt.value) || savedOptionConfigs[opt.value] || {};
                    if (meta.fileCount !== undefined) {
                        opt.fileCount = Number(meta.fileCount);
                    }
                    if (meta.fileSlotLabels !== undefined) {
                        opt.fileSlotLabels = meta.fileSlotLabels;
                    }
                    if (meta.imageUrl !== undefined) {
                        opt.imageUrl = meta.imageUrl;
                    }
                }
            }
        }
        return product;
    }
    async createProduct(dto, actorId) {
        const category = await this.prisma.productCategory.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID '${dto.categoryId}' not found`);
        }
        const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
        if (existingSlug) {
            throw new common_1.ConflictException(`Product slug '${dto.slug}' already in use`);
        }
        const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
        if (existingSku) {
            throw new common_1.ConflictException(`Product SKU '${dto.sku}' already in use`);
        }
        const product = await this.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    categoryId: dto.categoryId,
                    name: dto.name,
                    slug: dto.slug,
                    sku: dto.sku,
                    description: dto.description,
                    status: dto.status || catalogue_dto_1.ProductStatusDto.DRAFT,
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
                    artworkRequirement: dto.artworkRequirement || 'OPTIONAL',
                    artworkPrice: dto.artworkPrice !== undefined ? dto.artworkPrice : 0,
                    artworkQualityVerification: dto.artworkQualityVerification ?? true,
                    minimumArtworkMegapixels: dto.minimumArtworkMegapixels !== undefined ? dto.minimumArtworkMegapixels : 1.0,
                    referenceImageRequirement: dto.referenceImageRequirement || 'DISABLED',
                    designServiceRequirement: dto.designServiceRequirement || 'DISABLED',
                    designServicePrice: dto.designServicePrice !== undefined ? dto.designServicePrice : 0,
                    shippingChargeType: dto.shippingChargeType || 'DEFAULT',
                    unitWeightGrams: dto.unitWeightGrams !== undefined ? dto.unitWeightGrams : 0,
                    courierCharge: dto.courierCharge !== undefined ? dto.courierCharge : 100,
                    perAdditionalQtyRate: dto.perAdditionalQtyRate !== undefined ? dto.perAdditionalQtyRate : 0,
                    freeShippingThreshold: dto.freeShippingThreshold !== undefined ? dto.freeShippingThreshold : 1000,
                    allowCod: dto.allowCod !== undefined ? dto.allowCod : true,
                    codSurcharge: dto.codSurcharge !== undefined ? dto.codSurcharge : 50,
                },
            });
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
            if (dto.fields && dto.fields.length > 0) {
                for (let i = 0; i < dto.fields.length; i++) {
                    const f = dto.fields[i];
                    const fieldRecord = await tx.productField.create({
                        data: {
                            productId: created.id,
                            label: f.label,
                            key: f.key,
                            type: f.type || catalogue_dto_1.ProductFieldTypeDto.SELECT,
                            description: f.description,
                            placeholder: f.placeholder,
                            defaultValue: f.defaultValue,
                            isRequired: f.isRequired ?? true,
                            isCustomerVisible: f.isCustomerVisible ?? true,
                            isCustomerEditable: f.isCustomerEditable ?? true,
                            sortOrder: f.sortOrder ?? i,
                            validationRules: f.validationRules,
                            conditionalLogic: f.conditionalLogic,
                        },
                    });
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
    async updateProduct(id, dto, actorId) {
        const current = await this.getProductById(id);
        if (dto.slug && dto.slug !== current.slug) {
            const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
            if (existing) {
                throw new common_1.ConflictException(`Product slug '${dto.slug}' already exists`);
            }
        }
        if (dto.sku && dto.sku !== current.sku) {
            const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
            if (existing) {
                throw new common_1.ConflictException(`Product SKU '${dto.sku}' already exists`);
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
                status: dto.status,
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
                artworkRequirement: dto.artworkRequirement,
                artworkPrice: dto.artworkPrice,
                artworkQualityVerification: dto.artworkQualityVerification,
                minimumArtworkMegapixels: dto.minimumArtworkMegapixels,
                referenceImageRequirement: dto.referenceImageRequirement,
                designServiceRequirement: dto.designServiceRequirement,
                designServicePrice: dto.designServicePrice,
                shippingChargeType: dto.shippingChargeType,
                unitWeightGrams: dto.unitWeightGrams,
                courierCharge: dto.courierCharge,
                perAdditionalQtyRate: dto.perAdditionalQtyRate,
                freeShippingThreshold: dto.freeShippingThreshold,
                allowCod: dto.allowCod,
                codSurcharge: dto.codSurcharge,
            },
        });
        if (dto.fields !== undefined) {
            await this.prisma.$transaction(async (tx) => {
                await tx.productFieldOption.deleteMany({
                    where: { field: { productId: id } },
                });
                await tx.productField.deleteMany({
                    where: { productId: id },
                });
                for (let i = 0; i < dto.fields.length; i++) {
                    const f = dto.fields[i];
                    const fieldRecord = await tx.productField.create({
                        data: {
                            productId: id,
                            label: f.label,
                            key: f.key,
                            type: f.type || catalogue_dto_1.ProductFieldTypeDto.SELECT,
                            description: f.description,
                            defaultValue: f.defaultValue,
                            isRequired: f.isRequired ?? true,
                            isCustomerVisible: f.isCustomerVisible ?? true,
                            isCustomerEditable: f.isCustomerEditable ?? true,
                            sortOrder: f.sortOrder ?? i,
                        },
                    });
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
            });
        }
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
    async duplicateProduct(id, actorId) {
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
                    status: catalogue_dto_1.ProductStatusDto.DRAFT,
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
                        validationRules: f.validationRules,
                        conditionalLogic: f.conditionalLogic,
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
    async publishProduct(id, actorId) {
        const product = await this.getProductById(id);
        const errors = [];
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
            throw new common_1.BadRequestException({
                message: 'Cannot publish product due to validation failures',
                errors,
            });
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: {
                status: catalogue_dto_1.ProductStatusDto.PUBLISHED,
                isActive: true,
            },
        });
        await this.auditService.log({
            actorId,
            action: 'PRODUCT_PUBLISHED',
            entity: 'Product',
            entityId: id,
            previousState: { status: product.status },
            newState: { status: catalogue_dto_1.ProductStatusDto.PUBLISHED },
        });
        return updated;
    }
    async archiveProduct(id, actorId) {
        const product = await this.getProductById(id);
        const updated = await this.prisma.product.update({
            where: { id },
            data: {
                status: catalogue_dto_1.ProductStatusDto.ARCHIVED,
                isActive: false,
            },
        });
        await this.auditService.log({
            actorId,
            action: 'PRODUCT_ARCHIVED',
            entity: 'Product',
            entityId: id,
            previousState: { status: product.status },
            newState: { status: catalogue_dto_1.ProductStatusDto.ARCHIVED },
        });
        return updated;
    }
    async deleteProduct(id, actorId) {
        const product = await this.getProductById(id);
        const orderItemCount = await this.prisma.orderItem.count({
            where: { productId: id },
        });
        if (orderItemCount > 0) {
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
    async addField(productId, dto, actorId) {
        const product = await this.getProductById(productId);
        const existing = await this.prisma.productField.findUnique({
            where: {
                productId_key: {
                    productId,
                    key: dto.key,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Field key '${dto.key}' already exists for this product`);
        }
        const field = await this.prisma.$transaction(async (tx) => {
            const createdField = await tx.productField.create({
                data: {
                    productId,
                    label: dto.label,
                    key: dto.key,
                    type: dto.type || catalogue_dto_1.ProductFieldTypeDto.SELECT,
                    description: dto.description,
                    placeholder: dto.placeholder,
                    defaultValue: dto.defaultValue,
                    isRequired: dto.isRequired ?? true,
                    isCustomerVisible: dto.isCustomerVisible ?? true,
                    isCustomerEditable: dto.isCustomerEditable ?? true,
                    sortOrder: dto.sortOrder ?? 0,
                    validationRules: dto.validationRules,
                    conditionalLogic: dto.conditionalLogic,
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
    async updateField(fieldId, dto, actorId) {
        const current = await this.prisma.productField.findUnique({
            where: { id: fieldId },
        });
        if (!current) {
            throw new common_1.NotFoundException(`Product field with ID '${fieldId}' not found`);
        }
        const updated = await this.prisma.productField.update({
            where: { id: fieldId },
            data: {
                label: dto.label,
                type: dto.type,
                description: dto.description,
                placeholder: dto.placeholder,
                defaultValue: dto.defaultValue,
                isRequired: dto.isRequired,
                isCustomerVisible: dto.isCustomerVisible,
                isCustomerEditable: dto.isCustomerEditable,
                sortOrder: dto.sortOrder,
                validationRules: dto.validationRules,
                conditionalLogic: dto.conditionalLogic,
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
    async deleteField(fieldId, actorId) {
        const field = await this.prisma.productField.findUnique({
            where: { id: fieldId },
        });
        if (!field) {
            throw new common_1.NotFoundException(`Product field with ID '${fieldId}' not found`);
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
    async addFieldOption(fieldId, dto, actorId) {
        const field = await this.prisma.productField.findUnique({ where: { id: fieldId } });
        if (!field) {
            throw new common_1.NotFoundException(`Field with ID '${fieldId}' not found`);
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
    async updateFieldOption(optionId, dto, actorId) {
        const current = await this.prisma.productFieldOption.findUnique({
            where: { id: optionId },
        });
        if (!current) {
            throw new common_1.NotFoundException(`Option with ID '${optionId}' not found`);
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
    async deleteFieldOption(optionId, actorId) {
        const option = await this.prisma.productFieldOption.findUnique({
            where: { id: optionId },
        });
        if (!option) {
            throw new common_1.NotFoundException(`Option with ID '${optionId}' not found`);
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
    async uploadProductImage(productId, file, metadata, actorId) {
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
    async addProductImage(productId, dto, actorId) {
        const product = await this.getProductById(productId);
        return this.prisma.$transaction(async (tx) => {
            if (dto.isPrimary) {
                await tx.productImage.updateMany({
                    where: { productId },
                    data: { isPrimary: false },
                });
            }
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
    async setPrimaryImage(productId, imageId, actorId) {
        const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
        if (!image || image.productId !== productId) {
            throw new common_1.NotFoundException(`Image with ID '${imageId}' not found on this product`);
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
    async deleteProductImage(productId, imageId, actorId) {
        const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
        if (!image || image.productId !== productId) {
            throw new common_1.NotFoundException(`Image not found on product`);
        }
        await this.prisma.productImage.delete({ where: { id: imageId } });
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
    async reorderImages(productId, orderedImageIds, actorId) {
        await this.prisma.$transaction(orderedImageIds.map((id, index) => this.prisma.productImage.update({
            where: { id },
            data: { sortOrder: index },
        })));
        await this.auditService.log({
            actorId,
            action: 'PRODUCT_IMAGES_REORDERED',
            entity: 'Product',
            entityId: productId,
        });
        return { success: true, message: 'Image ordering updated' };
    }
    async listInventoryItems(query) {
        const where = {
            ...(query?.category ? { category: query.category } : {}),
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
    async createInventoryItem(dto, actorId) {
        const existing = await this.prisma.inventoryItem.findUnique({
            where: { sku: dto.sku },
        });
        if (existing) {
            throw new common_1.ConflictException(`Inventory SKU '${dto.sku}' already exists`);
        }
        const item = await this.prisma.$transaction(async (tx) => {
            const created = await tx.inventoryItem.create({
                data: {
                    name: dto.name,
                    sku: dto.sku,
                    category: dto.category,
                    unit: dto.unit,
                    currentStock: dto.currentStock,
                    minStockThreshold: dto.minStockThreshold || 100,
                    costPerUnit: dto.costPerUnit || 0,
                    location: dto.location,
                    notes: dto.notes,
                },
            });
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
    async updateInventoryItem(id, dto, actorId) {
        const current = await this.prisma.inventoryItem.findUnique({ where: { id } });
        if (!current) {
            throw new common_1.NotFoundException(`Inventory item with ID '${id}' not found`);
        }
        const updated = await this.prisma.inventoryItem.update({
            where: { id },
            data: {
                name: dto.name,
                sku: dto.sku,
                category: dto.category,
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
    async recordStockMovement(itemId, dto, actorId) {
        const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new common_1.NotFoundException(`Inventory item with ID '${itemId}' not found`);
        }
        const currentQty = Number(item.currentStock);
        const movementQty = Number(dto.quantity);
        let newBalance = currentQty;
        if (dto.type === 'STOCK_IN' || dto.type === 'RETURN') {
            newBalance = currentQty + movementQty;
        }
        else if (dto.type === 'CONSUMPTION' || dto.type === 'RELEASE') {
            if (currentQty < movementQty) {
                throw new common_1.BadRequestException(`Insufficient stock. Available: ${currentQty} ${item.unit}, Requested: ${movementQty} ${item.unit}`);
            }
            newBalance = currentQty - movementQty;
        }
        else if (dto.type === 'ADJUSTMENT') {
            newBalance = movementQty;
        }
        const movement = await this.prisma.$transaction(async (tx) => {
            await tx.inventoryItem.update({
                where: { id: itemId },
                data: { currentStock: newBalance },
            });
            return tx.stockMovement.create({
                data: {
                    inventoryItemId: itemId,
                    type: dto.type,
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
    async listStockMovements(itemId) {
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
    async listPricingRules(productId) {
        await this.getProductById(productId);
        return this.prisma.pricingMatrix.findMany({
            where: { productId },
            orderBy: { minQty: 'asc' },
        });
    }
    async addPricingRule(productId, dto, actorId) {
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
                unitPrice: new client_1.Prisma.Decimal(unitPrice),
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
    async updatePricingRule(ruleId, dto, actorId) {
        const current = await this.prisma.pricingMatrix.findUnique({ where: { id: ruleId } });
        if (!current) {
            throw new common_1.NotFoundException(`Pricing rule with ID '${ruleId}' not found`);
        }
        const product = await this.getProductById(current.productId);
        const base = Number(product.basePrice);
        let unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : Number(current.unitPrice);
        if (dto.discountPercent !== undefined && (!dto.unitPrice || dto.unitPrice <= 0)) {
            unitPrice = Math.round(base * (1 - dto.discountPercent / 100) * 10000) / 10000;
        }
        const currentCombo = current.attributeCombination || {};
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
                unitPrice: new client_1.Prisma.Decimal(unitPrice),
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
    async deletePricingRule(ruleId, actorId) {
        const current = await this.prisma.pricingMatrix.findUnique({ where: { id: ruleId } });
        if (!current) {
            throw new common_1.NotFoundException(`Pricing rule with ID '${ruleId}' not found`);
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
    async saveBatchPricingRules(productId, dto, actorId) {
        const product = await this.getProductById(productId);
        const base = Number(product.basePrice);
        return this.prisma.$transaction(async (tx) => {
            await tx.pricingMatrix.deleteMany({ where: { productId } });
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
                            unitPrice: new client_1.Prisma.Decimal(unitPrice),
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
    async listReusableAttributes() {
        const existing = await this.prisma.reusableAttribute.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        if (existing.length > 0) {
            return existing;
        }
        const defaultAttributes = [
            {
                name: 'Material',
                code: 'material',
                type: 'SELECT',
                description: 'Paper stock & substrate texture',
                options: [
                    { label: '350 GSM Heavy Art Card', value: '350gsm_art_card', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: '400 GSM Ultra-Thick Velvet Board', value: '400gsm_velvet_board', priceModifier: 0.60, priceModifierType: 'FIXED' },
                    { label: '300 GSM Natural Uncoated Ivory', value: '300gsm_ivory', priceModifier: 0.40, priceModifierType: 'FIXED' },
                    { label: '350 GSM Recycled Kraft Stock', value: '350gsm_kraft', priceModifier: 0.35, priceModifierType: 'FIXED' },
                ],
                sortOrder: 1,
            },
            {
                name: 'GSM',
                code: 'gsm',
                type: 'SELECT',
                description: 'Paper weight and density rating',
                options: [
                    { label: '300 GSM', value: '300_gsm', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: '350 GSM (+₹0.25/pc)', value: '350_gsm', priceModifier: 0.25, priceModifierType: 'FIXED' },
                    { label: '400 GSM (+₹0.50/pc)', value: '400_gsm', priceModifier: 0.50, priceModifierType: 'FIXED' },
                    { label: '450 GSM Heavy (+₹0.75/pc)', value: '450_gsm', priceModifier: 0.75, priceModifierType: 'FIXED' },
                ],
                sortOrder: 2,
            },
            {
                name: 'Lamination',
                code: 'lamination',
                type: 'SELECT',
                description: 'Protective thermal lamination coating',
                options: [
                    { label: 'Silky Thermal Matt Lamination', value: 'thermal_matt', priceModifier: 0.35, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Feather Soft Velvet Touch', value: 'velvet_touch', priceModifier: 0.85, priceModifierType: 'FIXED' },
                    { label: 'High Gloss Lamination', value: 'gloss', priceModifier: 0.25, priceModifierType: 'FIXED' },
                    { label: 'None (Uncoated Natural)', value: 'none', priceModifier: 0, priceModifierType: 'FIXED' },
                ],
                sortOrder: 3,
            },
            {
                name: 'Printing Location',
                code: 'printing_location',
                type: 'RADIO',
                description: 'Single side or double side press impression',
                options: [
                    { label: 'Front Side Only', value: 'front_only', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Both Sides (Front & Back)', value: 'front_and_back', priceModifier: 0.50, priceModifierType: 'FIXED' },
                ],
                sortOrder: 4,
            },
            {
                name: 'Special Finish',
                code: 'special_finish',
                type: 'SELECT',
                description: 'Premium tactile embellishments and foil effects',
                options: [
                    { label: 'None (Standard Print)', value: 'none', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Raised Spot UV Gloss', value: 'spot_uv', priceModifier: 0.65, priceModifierType: 'FIXED' },
                    { label: 'Executive Gold Foil Stamping', value: 'gold_foil', priceModifier: 1.20, priceModifierType: 'FIXED' },
                    { label: 'Executive Silver Foil Stamping', value: 'silver_foil', priceModifier: 1.10, priceModifierType: 'FIXED' },
                    { label: 'Embossing / Debossing', value: 'embossing', priceModifier: 0.95, priceModifierType: 'FIXED' },
                ],
                sortOrder: 5,
            },
            {
                name: 'Color',
                code: 'color',
                type: 'SELECT',
                description: 'Color reproduction mode',
                options: [
                    { label: 'Full Color CMYK (4/4)', value: 'cmyk_full', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Monochrome Grayscale / Black (1/1)', value: 'monochrome', priceModifier: -0.20, priceModifierType: 'FIXED' },
                    { label: 'CMYK + 1 Metallic Pantone Spot', value: 'pantone_spot', priceModifier: 1.50, priceModifierType: 'FIXED' },
                ],
                sortOrder: 6,
            },
            {
                name: 'Size',
                code: 'size',
                type: 'SELECT',
                description: 'Cut dimension options',
                options: [
                    { label: 'Standard Visiting Card (89 x 54 mm)', value: 'standard_89x54', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Square Format (65 x 65 mm)', value: 'square_65x65', priceModifier: 0.20, priceModifierType: 'FIXED' },
                    { label: 'European Slim (85 x 40 mm)', value: 'slim_85x40', priceModifier: 0.15, priceModifierType: 'FIXED' },
                    { label: 'Custom Dimension', value: 'custom', priceModifier: 0.50, priceModifierType: 'FIXED' },
                ],
                sortOrder: 7,
            },
            {
                name: 'Printing Type',
                code: 'printing_type',
                type: 'SELECT',
                description: 'Manufacturing press methodology',
                options: [
                    { label: 'Digital Offset (Fast Turnaround)', value: 'digital_offset', priceModifier: 0, priceModifierType: 'FIXED', isDefault: true },
                    { label: 'Sheetfed Commercial Offset (Bulk Runs)', value: 'sheetfed_offset', priceModifier: -0.10, priceModifierType: 'FIXED' },
                    { label: 'High-Definition UV Flatbed', value: 'uv_flatbed', priceModifier: 1.00, priceModifierType: 'FIXED' },
                ],
                sortOrder: 8,
            },
        ];
        for (const attr of defaultAttributes) {
            await this.prisma.reusableAttribute.create({
                data: {
                    name: attr.name,
                    code: attr.code,
                    type: attr.type,
                    description: attr.description,
                    options: attr.options,
                    sortOrder: attr.sortOrder,
                    isActive: true,
                },
            });
        }
        const list = await this.prisma.reusableAttribute.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        return list.map((attr) => {
            const opts = Array.isArray(attr.options) ? attr.options : [];
            const hasOptionAddon = opts.some((o) => o.isOptionalAddOn === true);
            const isAddOn = hasOptionAddon || Boolean(opts[0]?.isOptionalAddOn || attr.isOptionalAddOn);
            return {
                ...attr,
                isOptionalAddOn: isAddOn,
            };
        });
    }
    async getReusableAttributeById(id) {
        const attr = await this.prisma.reusableAttribute.findUnique({ where: { id } });
        if (!attr) {
            throw new common_1.NotFoundException(`Reusable attribute with ID '${id}' not found`);
        }
        const opts = Array.isArray(attr.options) ? attr.options : [];
        const hasOptionAddon = opts.some((o) => o.isOptionalAddOn === true);
        const isAddOn = hasOptionAddon || Boolean(opts[0]?.isOptionalAddOn || attr.isOptionalAddOn);
        return {
            ...attr,
            isOptionalAddOn: isAddOn,
        };
    }
    async createReusableAttribute(dto, actorId) {
        const existing = await this.prisma.reusableAttribute.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException(`Attribute code '${dto.code}' already exists`);
        }
        const isAddOn = Boolean(dto.isOptionalAddOn);
        const optionsWithMeta = (dto.options || []).map((o) => ({
            ...o,
            isOptionalAddOn: isAddOn,
        }));
        const created = await this.prisma.reusableAttribute.create({
            data: {
                name: dto.name,
                code: dto.code,
                type: dto.type || 'SELECT',
                description: dto.description,
                options: optionsWithMeta,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
        await this.auditService.log({
            actorId,
            action: 'REUSABLE_ATTRIBUTE_CREATED',
            entity: 'ReusableAttribute',
            entityId: created.id,
            newState: created,
        });
        return {
            ...created,
            isOptionalAddOn: isAddOn,
        };
    }
    async updateReusableAttribute(id, dto, actorId) {
        const current = await this.getReusableAttributeById(id);
        if (dto.code && dto.code !== current.code) {
            const existing = await this.prisma.reusableAttribute.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new common_1.ConflictException(`Attribute code '${dto.code}' already exists`);
            }
        }
        const isAddOn = dto.isOptionalAddOn !== undefined
            ? Boolean(dto.isOptionalAddOn)
            : Boolean(current.isOptionalAddOn);
        let optionsToSave = dto.options;
        if (optionsToSave) {
            optionsToSave = optionsToSave.map((o) => ({ ...o, isOptionalAddOn: isAddOn }));
        }
        else if (dto.isOptionalAddOn !== undefined) {
            const currentOptions = current.options || [];
            optionsToSave = currentOptions.map((o) => ({ ...o, isOptionalAddOn: isAddOn }));
        }
        const updated = await this.prisma.reusableAttribute.update({
            where: { id },
            data: {
                ...(dto.name ? { name: dto.name } : {}),
                ...(dto.code ? { code: dto.code } : {}),
                ...(dto.type ? { type: dto.type } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(optionsToSave ? { options: optionsToSave } : {}),
                ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            },
        });
        await this.auditService.log({
            actorId,
            action: 'REUSABLE_ATTRIBUTE_UPDATED',
            entity: 'ReusableAttribute',
            entityId: id,
            previousState: current,
            newState: updated,
        });
        return {
            ...updated,
            isOptionalAddOn: isAddOn,
        };
    }
    async deleteReusableAttribute(id, actorId) {
        const current = await this.getReusableAttributeById(id);
        await this.prisma.reusableAttribute.update({
            where: { id },
            data: { isActive: false },
        });
        await this.auditService.log({
            actorId,
            action: 'REUSABLE_ATTRIBUTE_DELETED',
            entity: 'ReusableAttribute',
            entityId: id,
            previousState: current,
        });
        return { success: true, message: `Attribute '${current.name}' deleted successfully` };
    }
};
exports.AdminCatalogueService = AdminCatalogueService;
exports.AdminCatalogueService = AdminCatalogueService = AdminCatalogueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AdminCatalogueService);
//# sourceMappingURL=admin-catalogue.service.js.map