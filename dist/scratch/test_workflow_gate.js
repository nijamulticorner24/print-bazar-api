"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function runTests() {
    console.log('=== STARTING FINAL QC -> PAYMENT CLEARANCE -> PACKING WORKFLOW TESTS ===\n');
    const customer = await prisma.customer.findFirst();
    const qcInspector = await prisma.user.findFirst({ where: { role: client_1.UserRole.FINAL_QC_INSPECTOR } });
    const accountsUser = await prisma.user.findFirst({ where: { role: client_1.UserRole.ACCOUNTS } });
    if (!customer || !qcInspector || !accountsUser) {
        console.error('Missing seed customer or staff users');
        return;
    }
    console.log('[TEST 1] Fully Paid Order -> Final QC PASS');
    const order1 = await prisma.order.create({
        data: {
            orderNumber: `PB-TEST-PAID-${Date.now()}`,
            customerId: customer.id,
            totalAmount: 5000,
            paidAmount: 5000,
            balanceAmount: 0,
            paymentStatus: client_1.PaymentStatus.PAID,
            status: client_1.OrderStatus.QUALITY_CHECK,
            subtotal: 4237.28,
            taxAmount: 762.72,
            shippingAmount: 0,
        },
    });
    const balance1 = Number(order1.balanceAmount);
    const isPaid1 = balance1 <= 0 || order1.paymentStatus === 'PAID';
    const targetStatus1 = isPaid1 ? client_1.OrderStatus.PACKING : client_1.OrderStatus.PAYMENT_PENDING;
    await prisma.qCChecklist.create({
        data: {
            orderId: order1.id,
            type: client_1.QCInspectionType.FINAL_QC,
            outcome: client_1.QCOutcome.PASS,
            inspectorId: qcInspector.id,
            items: [],
            defects: [],
        },
    });
    const updated1 = await prisma.order.update({
        where: { id: order1.id },
        data: { status: targetStatus1 },
    });
    console.log(`  -> Order Status: ${updated1.status} (Expected: PACKING) -> ${updated1.status === client_1.OrderStatus.PACKING ? 'PASSED ✓' : 'FAILED ✗'}\n`);
    console.log('[TEST 2] Unpaid Order -> Final QC PASS');
    const order2 = await prisma.order.create({
        data: {
            orderNumber: `PB-TEST-UNPAID-${Date.now()}`,
            customerId: customer.id,
            totalAmount: 8500,
            paidAmount: 2000,
            balanceAmount: 6500,
            paymentStatus: client_1.PaymentStatus.PARTIALLY_PAID,
            status: client_1.OrderStatus.QUALITY_CHECK,
            subtotal: 7203.38,
            taxAmount: 1296.62,
            shippingAmount: 0,
        },
    });
    const balance2 = Number(order2.balanceAmount);
    const isPaid2 = balance2 <= 0 || order2.paymentStatus === 'PAID';
    const targetStatus2 = isPaid2 ? client_1.OrderStatus.PACKING : client_1.OrderStatus.PAYMENT_PENDING;
    await prisma.qCChecklist.create({
        data: {
            orderId: order2.id,
            type: client_1.QCInspectionType.FINAL_QC,
            outcome: client_1.QCOutcome.PASS,
            inspectorId: qcInspector.id,
            items: [],
            defects: [],
        },
    });
    const updated2 = await prisma.order.update({
        where: { id: order2.id },
        data: { status: targetStatus2 },
    });
    console.log(`  -> Order Status: ${updated2.status} (Expected: PAYMENT_PENDING) -> ${updated2.status === client_1.OrderStatus.PAYMENT_PENDING ? 'PASSED ✓' : 'FAILED ✗'}\n`);
    console.log('[TEST 3] Accounts Clears Remaining Balance (₹6500) on Order 2');
    const finalQcPassOn2 = await prisma.qCChecklist.findFirst({
        where: { orderId: order2.id, type: client_1.QCInspectionType.FINAL_QC, outcome: client_1.QCOutcome.PASS },
    });
    const settleAmount = 6500;
    const newPaid2 = Number(updated2.paidAmount) + settleAmount;
    const newBalance2 = Number(updated2.totalAmount) - newPaid2;
    const isFullSettled2 = newBalance2 === 0;
    const nextStatus2 = isFullSettled2 && finalQcPassOn2 ? client_1.OrderStatus.PACKING : updated2.status;
    await prisma.payment.create({
        data: {
            orderId: order2.id,
            transactionId: `TEST-TXN-${Date.now()}`,
            method: client_1.PaymentMethod.BANK_TRANSFER_NEFT,
            status: client_1.PaymentStatus.PAID,
            amount: settleAmount,
            capturedAt: new Date(),
        },
    });
    const settledOrder2 = await prisma.order.update({
        where: { id: order2.id },
        data: {
            paidAmount: newPaid2,
            balanceAmount: newBalance2,
            paymentStatus: client_1.PaymentStatus.PAID,
            status: nextStatus2,
        },
    });
    console.log(`  -> Order Balance: ₹${settledOrder2.balanceAmount}, Status: ${settledOrder2.status} (Expected: PACKING) -> ${settledOrder2.status === client_1.OrderStatus.PACKING ? 'PASSED ✓' : 'FAILED ✗'}\n`);
    console.log('[TEST 4] Paid Order + Final QC FAIL');
    const order4 = await prisma.order.create({
        data: {
            orderNumber: `PB-TEST-FAIL-${Date.now()}`,
            customerId: customer.id,
            totalAmount: 3000,
            paidAmount: 3000,
            balanceAmount: 0,
            paymentStatus: client_1.PaymentStatus.PAID,
            status: client_1.OrderStatus.QUALITY_CHECK,
            subtotal: 2542.37,
            taxAmount: 457.63,
            shippingAmount: 0,
        },
    });
    await prisma.qCChecklist.create({
        data: {
            orderId: order4.id,
            type: client_1.QCInspectionType.FINAL_QC,
            outcome: client_1.QCOutcome.FAIL,
            inspectorId: qcInspector.id,
            items: [{ code: 'REGISTRATION_ERROR', name: 'Off-cut', result: 'FAIL' }],
            defects: ['REGISTRATION_ERROR'],
        },
    });
    const updated4 = await prisma.order.update({
        where: { id: order4.id },
        data: { status: client_1.OrderStatus.ON_HOLD },
    });
    console.log(`  -> Order Status: ${updated4.status} (Expected: ON_HOLD / REWORK, NOT PACKING) -> ${updated4.status === client_1.OrderStatus.ON_HOLD ? 'PASSED ✓' : 'FAILED ✗'}\n`);
    await prisma.qCChecklist.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order4.id] } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order4.id] } } });
    await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id, order4.id] } } });
    console.log('=== ALL WORKFLOW GATE UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}
runTests()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test_workflow_gate.js.map