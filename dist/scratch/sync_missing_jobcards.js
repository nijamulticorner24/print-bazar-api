"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const job_card_engine_service_1 = require("../src/modules/job-cards/job-card-engine.service");
const prisma_service_1 = require("../src/modules/prisma/prisma.service");
const audit_service_1 = require("../src/modules/audit/audit.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma = new client_1.PrismaClient();
async function main() {
    const prismaService = new prisma_service_1.PrismaService();
    await prismaService.$connect();
    const auditService = new audit_service_1.AuditService(prismaService);
    const eventEmitter = new event_emitter_1.EventEmitter2();
    const engine = new job_card_engine_service_1.JobCardEngineService(prismaService, auditService, eventEmitter);
    const orders = await prisma.order.findMany({
        where: {
            status: { in: ['PRODUCTION_QUEUE', 'PRINTING', 'FINISHING', 'QUALITY_CHECK'] },
        },
        include: {
            items: {
                include: {
                    jobCards: true,
                },
            },
        },
    });
    console.log(`Checking ${orders.length} in-production orders...`);
    for (const order of orders) {
        for (const item of order.items) {
            if (item.jobCards.length === 0) {
                try {
                    const jc = await engine.generateJobCardForOrderItem(item.id);
                    console.log(`Generated Job Card ${jc.jobNumber} for Order ${order.orderNumber}`);
                }
                catch (e) {
                    console.error(`Failed to generate Job Card for Order ${order.orderNumber}:`, e.message);
                }
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=sync_missing_jobcards.js.map