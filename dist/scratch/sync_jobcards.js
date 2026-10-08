"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const updated = await prisma.jobCard.updateMany({
        where: {
            order: {
                status: { in: ['PACKING', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'] }
            },
            status: { not: client_1.JobCardStatus.COMPLETED }
        },
        data: {
            status: client_1.JobCardStatus.COMPLETED,
            currentStation: 'PACKING',
            completedAt: new Date()
        }
    });
    console.log(`Updated ${updated.count} job cards to COMPLETED.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=sync_jobcards.js.map