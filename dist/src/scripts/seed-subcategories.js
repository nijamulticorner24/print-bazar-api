"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const packaging = await prisma.productCategory.findFirst({ where: { slug: { contains: 'packag' } } });
    if (packaging) {
        await prisma.productCategory.upsert({
            where: { slug: 'rigid-presentation-boxes' },
            update: { parentId: packaging.id },
            create: {
                name: 'Rigid Presentation Boxes',
                slug: 'rigid-presentation-boxes',
                description: 'Luxury Kappa Board boxes with custom velvet and foil lining.',
                image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
                parentId: packaging.id,
                sortOrder: 1,
                isActive: true,
            },
        });
        await prisma.productCategory.upsert({
            where: { slug: 'mono-cartons' },
            update: { parentId: packaging.id },
            create: {
                name: 'Mono Cartons & Retail Boxes',
                slug: 'mono-cartons',
                description: 'Folding cartons for cosmetics, pharmaceuticals, and retail display.',
                image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
                parentId: packaging.id,
                sortOrder: 2,
                isActive: true,
            },
        });
        await prisma.productCategory.upsert({
            where: { slug: 'corrugated-mailers' },
            update: { parentId: packaging.id },
            create: {
                name: 'Corrugated Mailer Boxes',
                slug: 'corrugated-mailers',
                description: 'High-strength e-commerce dispatch mailers and shippers.',
                image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
                parentId: packaging.id,
                sortOrder: 3,
                isActive: true,
            },
        });
    }
    const signs = await prisma.productCategory.findFirst({ where: { slug: { contains: 'sign' } } });
    if (signs) {
        const standeeCat = await prisma.productCategory.upsert({
            where: { slug: 'roll-up-standees-sub' },
            update: { parentId: signs.id },
            create: {
                name: 'Roll-Up Luxury Standees',
                slug: 'roll-up-standees-sub',
                description: 'Anodized aluminium pull-up exhibition display banners.',
                image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=600&auto=format&fit=crop&q=80',
                parentId: signs.id,
                sortOrder: 1,
                isActive: true,
            },
        });
        await prisma.productCategory.upsert({
            where: { slug: 'vinyl-flex-banners' },
            update: { parentId: signs.id },
            create: {
                name: 'Vinyl & Fabric Banners',
                slug: 'vinyl-flex-banners',
                description: 'Outdoor frontlit & backlit weather-resistant flex banners.',
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
                parentId: signs.id,
                sortOrder: 2,
                isActive: true,
            },
        });
        const standeeProd = await prisma.product.findFirst({ where: { slug: 'roll-up-luxury-standee' } });
        if (standeeProd && standeeCat) {
            await prisma.product.update({
                where: { id: standeeProd.id },
                data: { categoryId: standeeCat.id },
            });
        }
    }
    console.log('✅ Sample Subcategories seeded successfully!');
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-subcategories.js.map