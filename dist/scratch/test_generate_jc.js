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
    const order = await prisma.order.findFirst({
        where: { orderNumber: { contains: '20261003-0004' } },
        include: { items: true },
    });
    if (!order) {
        console.log('Order not found');
        return;
    }
    for (const item of order.items) {
        try {
            const jc = await engine.generateJobCardForOrderItem(item.id);
            console.log('Successfully generated JC:', jc.jobNumber);
        }
        catch (e) {
            console.error('Failed to generate JC:', e.message);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_generate_jc.js.map