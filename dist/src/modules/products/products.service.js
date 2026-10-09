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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProducts(categoryId, search) {
        let categoryCondition = undefined;
        if (categoryId) {
            const subcats = await this.prisma.productCategory.findMany({
                where: { parentId: categoryId, isActive: true },
                select: { id: true },
            });
            const catIds = [categoryId, ...subcats.map((s) => s.id)];
            categoryCondition = { categoryId: { in: catIds } };
        }
        const where = {
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
    async getProductBySlug(slug) {
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
            throw new common_1.NotFoundException(`Product with slug '${slug}' not found or is currently unavailable`);
        }
        return product;
    }
    async listCategories() {
        return this.prisma.productCategory.findMany({
            where: { isActive: true },
            include: {
                parent: {
                    select: { id: true, name: true, slug: true },
                },
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        _count: {
                            select: {
                                products: {
                                    where: { status: 'PUBLISHED', isActive: true },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        products: {
                            where: { status: 'PUBLISHED', isActive: true },
                        },
                        children: {
                            where: { isActive: true },
                        },
                    },
                },
            },
            orderBy: [{ sortOrder: 'asc' }],
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map