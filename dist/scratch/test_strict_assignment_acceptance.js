"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const BASE_URL = 'http://localhost:4000/api/v1';
async function login(email, password = 'Admin@12345') {
    const res = await axios_1.default.post(`${BASE_URL}/auth/login`, { email, password });
    return res.data.accessToken;
}
async function runAcceptanceTests() {
    console.log('=== STRICT INDIVIDUAL TASK ASSIGNMENT ACCEPTANCE TESTS ===\n');
    const oeEmail = 'operations@printbazzar.com';
    const designerAEmail = 'prepress@printbazzar.com';
    const designerBEmail = 'anjali.m@printbazzar.com';
    const operatorAEmail = 'operator@printbazzar.com';
    const operatorBEmail = 'arun.print@printbazzar.com';
    console.log('1. Authenticating all test roles...');
    const oeToken = await login(oeEmail);
    const designerAToken = await login(designerAEmail);
    const designerBToken = await login(designerBEmail);
    const operatorAToken = await login(operatorAEmail);
    const operatorBToken = await login(operatorBEmail);
    console.log('✓ Successfully authenticated OE, Designer A, Designer B, Operator A, Operator B\n');
    const oeHeaders = { Authorization: `Bearer ${oeToken}` };
    const desAHeaders = { Authorization: `Bearer ${designerAToken}` };
    const desBHeaders = { Authorization: `Bearer ${designerBToken}` };
    const opAHeaders = { Authorization: `Bearer ${operatorAToken}` };
    const opBHeaders = { Authorization: `Bearer ${operatorBToken}` };
    console.log('2. OE inspecting operational orders list...');
    const ordersRes = await axios_1.default.get(`${BASE_URL}/operations/orders`, { headers: oeHeaders });
    const orders = ordersRes.data.data || ordersRes.data.orders || ordersRes.data;
    console.log(`✓ OE can view all authorized operational orders (total: ${orders.length})`);
    const designOrder = orders.find((o) => o.status === 'DESIGN_REQUIRED') || orders[0];
    const prodOrder = orders.find((o) => o.status === 'PRODUCTION_QUEUE' || o.status === 'ARTWORK_APPROVED') || orders[1];
    console.log(`Selected design test order: ${designOrder.orderNumber} (${designOrder.id})`);
    console.log(`Selected production test order: ${prodOrder.orderNumber} (${prodOrder.id})\n`);
    console.log('Test 1 & 2: Assigning design task to Designer A...');
    const designerAId = '8f1d34a6-9509-441f-9b02-dab9611999a9';
    const designerBId = 'e04f9529-0bcb-4513-8cfb-1fe85073e8ef';
    await axios_1.default.post(`${BASE_URL}/operations/orders/${designOrder.id}/design-assignment`, { designerId: designerAId, reason: 'Assigned strictly to Designer A' }, { headers: oeHeaders });
    console.log('✓ OE assigned task to Designer A');
    const desAQueue = await axios_1.default.get(`${BASE_URL}/artwork/design-queue`, { headers: desAHeaders });
    const desAHasOrder = desAQueue.data.some((o) => o.id === designOrder.id);
    console.log(`✓ Designer A queue contains order: ${desAHasOrder} (count: ${desAQueue.data.length})`);
    if (!desAHasOrder)
        throw new Error('FAILED: Designer A does not see assigned task!');
    const desBQueue = await axios_1.default.get(`${BASE_URL}/artwork/design-queue`, { headers: desBHeaders });
    const desBHasOrder = desBQueue.data.some((o) => o.id === designOrder.id);
    console.log(`✓ Designer B queue contains order: ${desBHasOrder} (count: ${desBQueue.data.length})`);
    if (desBHasOrder)
        throw new Error('FAILED: Designer B saw a task assigned exclusively to Designer A!');
    console.log('✓ PASS: Designer B cannot see Designer A’s task in their personal queue.\n');
    const desAHasProdOrder = desAQueue.data.some((o) => o.id === prodOrder.id);
    console.log(`✓ Designer A queue contains production order: ${desAHasProdOrder}`);
    if (desAHasProdOrder)
        throw new Error('FAILED: Designer queue contains production order!');
    console.log('✓ PASS: Prepress designers do not see production tasks in design queue.\n');
    console.log('Test 7: Reassigning design task from Designer A to Designer B...');
    await axios_1.default.post(`${BASE_URL}/operations/orders/${designOrder.id}/design-assignment`, { designerId: designerBId, reason: 'Reassigned from A to B' }, { headers: oeHeaders });
    const desAQueueAfter = await axios_1.default.get(`${BASE_URL}/artwork/design-queue`, { headers: desAHeaders });
    const desBQueueAfter = await axios_1.default.get(`${BASE_URL}/artwork/design-queue`, { headers: desBHeaders });
    const desAHasAfter = desAQueueAfter.data.some((o) => o.id === designOrder.id);
    const desBHasAfter = desBQueueAfter.data.some((o) => o.id === designOrder.id);
    console.log(`✓ After reassignment - Designer A has order: ${desAHasAfter}, Designer B has order: ${desBHasAfter}`);
    if (desAHasAfter || !desBHasAfter) {
        throw new Error('FAILED: Reassignment did not cleanly transfer task ownership between designers!');
    }
    console.log('✓ PASS: Reassigning removes task from former owner’s queue and adds to new owner’s queue.\n');
    console.log('Test 8: Security check - Designer A attempting to complete Designer B’s task...');
    try {
        await axios_1.default.post(`${BASE_URL}/artwork/design/${designOrder.id}/complete`, {
            storageKey: 'test-key.pdf',
            originalFileName: 'test.pdf',
            prepressNotes: 'Bypassing ownership test',
        }, { headers: desAHeaders });
        throw new Error('FAILED: Designer A was able to complete Designer B’s task without ownership!');
    }
    catch (err) {
        if (err.response?.status === 403) {
            console.log(`✓ PASS: Server correctly rejected unauthorized modification with HTTP 403 Forbidden: "${err.response.data.message}"`);
        }
        else {
            throw new Error(`Unexpected response: ${err.message}`);
        }
    }
    console.log('\nTest 5 & 6: Testing Production Operator assignment...');
    const operatorAId = 'b53ac7e3-08b2-4704-9049-4d646b27367f';
    const operatorBId = '61960d33-059a-42c6-9383-a029ec80d141';
    await axios_1.default.post(`${BASE_URL}/operations/orders/${prodOrder.id}/production-assignment`, { operatorId: operatorAId, reason: 'Assign strictly to Operator A' }, { headers: oeHeaders });
    console.log('✓ OE assigned production task to Operator A');
    const opABoard = await axios_1.default.get(`${BASE_URL}/production/board`, { headers: opAHeaders });
    const opACards = opABoard.data.columns.flatMap((c) => c.cards);
    const opAHasJob = opACards.some((c) => c.orderNumber === prodOrder.orderNumber);
    console.log(`✓ Operator A board cards count: ${opACards.length}, contains assigned order: ${opAHasJob}`);
    const opBBoard = await axios_1.default.get(`${BASE_URL}/production/board`, { headers: opBHeaders });
    const opBCards = opBBoard.data.columns.flatMap((c) => c.cards);
    const opBHasJob = opBCards.some((c) => c.orderNumber === prodOrder.orderNumber);
    console.log(`✓ Operator B board cards count: ${opBCards.length}, contains Operator A order: ${opBHasJob}`);
    if (!opAHasJob)
        throw new Error('FAILED: Operator A does not see assigned job in production board!');
    if (opBHasJob)
        throw new Error('FAILED: Operator B saw job assigned exclusively to Operator A!');
    console.log('✓ PASS: Production board strictly filters cards by authenticated operator ID.\n');
    console.log('Test 8 (part 2): Security check - Operator B attempting to transition Operator A’s job card...');
    const targetCard = opACards.find((c) => c.orderNumber === prodOrder.orderNumber);
    if (targetCard) {
        try {
            await axios_1.default.post(`${BASE_URL}/production/jobs/${targetCard.id}/transition`, { targetColumnKey: 'PRINTING', reason: 'Tamper test' }, { headers: opBHeaders });
            throw new Error('FAILED: Operator B was able to transition Operator A’s job card!');
        }
        catch (err) {
            if (err.response?.status === 403) {
                console.log(`✓ PASS: Server correctly rejected unauthorized operator action with HTTP 403 Forbidden: "${err.response.data.message}"`);
            }
            else {
                throw new Error(`Unexpected status: ${err.message}`);
            }
        }
    }
    console.log('\nPrerequisite gate test: OE attempting to assign Operator to an order where artwork is pending...');
    try {
        await axios_1.default.post(`${BASE_URL}/operations/orders/${designOrder.id}/production-assignment`, { operatorId: operatorAId, reason: 'Premature operator assignment' }, { headers: oeHeaders });
        throw new Error('FAILED: Server allowed operator assignment before artwork was approved!');
    }
    catch (err) {
        if (err.response?.status === 400) {
            console.log(`✓ PASS: Server blocked premature operator assignment with HTTP 400 Bad Request: "${err.response.data.message}"`);
        }
        else {
            throw new Error(`Unexpected error: ${err.message}`);
        }
    }
    console.log('\n======================================================');
    console.log('🎉 ALL 10 ACCEPTANCE CRITERIA PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================');
}
runAcceptanceTests().catch((err) => {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
});
//# sourceMappingURL=test_strict_assignment_acceptance.js.map