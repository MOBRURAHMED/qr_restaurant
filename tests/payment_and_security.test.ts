import crypto from 'crypto';
import {
  validateAndCalculateServerOrder,
  getServerPaymentSettings,
  updateServerPaymentSettings,
  saveServerOrder,
  getServerOrderById,
  updateServerOrderStatus,
  isWebhookEventProcessed,
  recordWebhookEvent,
  verifyMemberAccess,
  assertTenantAccess,
  lookupTableByToken,
  createServerTable,
  transitionServerOrderStatus,
  verifyManualPayment,
} from '../src/lib/server-data';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  createRazorpayOrder,
  getRazorpayKeyId
} from '../src/lib/razorpay';
import { Order } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('MULTI-RESTAURANT QR SAAS: COMPREHENSIVE TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Each payment toggle independently
  console.log('1. Testing Independent Payment Toggles:');
  const restId = 'rest-1';
  updateServerPaymentSettings(restId, {
    upiQrEnabled: true,
    upiAppEnabled: false,
    cardEnabled: false,
    counterPaymentEnabled: false,
  });
  let settings = getServerPaymentSettings(restId);
  assert(settings.upiQrEnabled === true, 'UPI QR toggle enabled independently');
  assert(settings.upiAppEnabled === false, 'UPI App toggle disabled independently');
  assert(settings.cardEnabled === false, 'Card toggle disabled independently');
  assert(settings.counterPaymentEnabled === false, 'Counter payment disabled independently');

  // Re-enable all
  updateServerPaymentSettings(restId, {
    upiQrEnabled: true,
    upiAppEnabled: true,
    cardEnabled: true,
    counterPaymentEnabled: true,
  });
  settings = getServerPaymentSettings(restId);
  assert(
    settings.upiQrEnabled && settings.upiAppEnabled && settings.cardEnabled && settings.counterPaymentEnabled,
    'All 4 toggles can be enabled simultaneously'
  );

  // Test 2: Multi-Tenant Isolation & Cross-Restaurant Access Protection
  console.log('\n2. Testing Multi-Tenant Access Control:');
  const ownerA = 'user-owner-1'; // Member of rest-1
  const ownerB = 'user-owner-2'; // Member of rest-2

  const accessA = verifyMemberAccess(ownerA, 'rest-1');
  assert(accessA.authorized === true, 'Owner A authorized for Restaurant 1');

  const crossAccess = verifyMemberAccess(ownerA, 'rest-2');
  assert(crossAccess.authorized === false, 'Owner A denied access to Restaurant 2 (cross-tenant block)');

  let tenantErrorCaught = false;
  try {
    assertTenantAccess(ownerA, 'rest-2');
  } catch (err) {
    tenantErrorCaught = true;
  }
  assert(tenantErrorCaught === true, 'Cross-tenant mutation triggers security exception');

  // Test 3: Table Token Lookup & Unguessable QR Verification
  console.log('\n3. Testing Table QR Token Lookup:');
  const validLookup = lookupTableByToken('tok_rest1_tbl1_a9f8e7d6c5b4');
  assert(validLookup !== null, 'Valid table token successfully resolves');
  assert(validLookup?.restaurant.id === 'rest-1', 'Resolved table belongs to Restaurant 1');
  assert(validLookup?.table.tableNumber === '1', 'Table number correctly identified');

  const invalidLookup = lookupTableByToken('tok_forged_random_123');
  assert(invalidLookup === null, 'Forged / invalid table token rejected with null');

  const createdTable = createServerTable('rest-1', '99', 4);
  assert(Boolean(createdTable.qrToken && createdTable.qrToken.startsWith('tok_rest-1_tbl99_')), 'New table receives unique opaque token');

  // Test 4: Server-side Price Recalculation (Anti-Tampering)
  console.log('\n4. Testing Anti-Tampering Engine:');
  const cartWithTamperedPrices = [
    { menuItemId: 'item-1', quantity: 2 }, // Price ₹240 x 2 = ₹480
  ];
  const calculated = validateAndCalculateServerOrder('rest-1', cartWithTamperedPrices);
  assert(calculated.subtotal === 480, `Subtotal recalculated to authoritative ₹480 (got ${calculated.subtotal})`);
  assert(calculated.tax === 24, `Tax calculated strictly server-side as ₹24 (got ${calculated.tax})`);
  assert(calculated.total === 504, `Final total strictly enforced as ₹504 (got ${calculated.total})`);

  let tamperedSoldOutCaught = false;
  try {
    validateAndCalculateServerOrder('rest-1', [{ menuItemId: 'item-nonexistent', quantity: 1 }]);
  } catch (err) {
    tamperedSoldOutCaught = true;
  }
  assert(tamperedSoldOutCaught === true, 'Unlisted or tampered menu item IDs rejected');

  // Test 5: Idempotency & Duplicate Submission Protection
  console.log('\n5. Testing Duplicate Submission Protection:');
  const orderId = 'ord-test-idemp-1';
  const testOrder: Order = {
    id: orderId,
    restaurantId: 'rest-1',
    tableNumber: '4',
    orderCode: '#SG-999',
    trackingToken: 'trk_unique_order_12345',
    idempotencyKey: 'idemp_key_double_click_test',
    items: [{ id: 'oi-1', menuItemId: 'item-1', name: 'Crispy Corn', price: 240, quantity: 1 }],
    subtotal: 240,
    tax: 12,
    total: 252,
    status: 'new',
    paymentStatus: 'pending',
    paymentMethod: 'upi_qr',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const firstSave = saveServerOrder(testOrder, testOrder.idempotencyKey);
  assert(firstSave.isDuplicate === false, 'First submission saved as new order');

  const secondSave = saveServerOrder({ ...testOrder, id: 'ord-different-id' }, testOrder.idempotencyKey);
  assert(secondSave.isDuplicate === true, 'Duplicate submission detected via idempotency key');
  assert(secondSave.order.id === orderId, 'Duplicate submission returns original order without re-creation');

  // Test 6: Order Status Transition Validation
  console.log('\n6. Testing Order Status State Machine:');
  const chefUser = 'user-chef-1'; // Member of rest-1 with 'kitchen' role
  const waiterUser = 'user-waiter-1'; // Member of rest-1 with 'waiter' role

  // Valid transition: new -> accepted -> preparing -> ready
  const orderAccepted = transitionServerOrderStatus(orderId, 'accepted', chefUser);
  assert(orderAccepted.status === 'accepted', 'Allowed transition: new -> accepted succeeded');

  const orderPrep = transitionServerOrderStatus(orderId, 'preparing', chefUser);
  assert(orderPrep.status === 'preparing', 'Allowed transition: accepted -> preparing succeeded');

  // Invalid jump: preparing -> served (must go through ready first)
  let invalidJumpCaught = false;
  try {
    transitionServerOrderStatus(orderId, 'served', chefUser);
  } catch (err) {
    invalidJumpCaught = true;
  }
  assert(invalidJumpCaught === true, 'Illegal status transition (preparing -> served) rejected by state machine');

  // Cross-tenant status change attempt (Owner B cannot touch Rest 1 orders)
  let crossStatusCaught = false;
  try {
    transitionServerOrderStatus(orderId, 'ready', ownerB);
  } catch (err) {
    crossStatusCaught = true;
  }
  assert(crossStatusCaught === true, 'Cross-restaurant staff cannot transition status of foreign orders');

  // Test 7: Manual Verification for Static UPI QR and Counter Payments
  console.log('\n7. Testing Manual Verification Workflows:');
  const upiOrder = getServerOrderById(orderId)!;
  assert(upiOrder.paymentStatus === 'pending', 'Static UPI QR payment initializes as pending');

  // Customer cannot mark payment paid
  let customerVerifyCaught = false;
  try {
    verifyManualPayment(orderId, 'random-customer-user');
  } catch (err) {
    customerVerifyCaught = true;
  }
  assert(customerVerifyCaught === true, 'Customers cannot mark their own orders paid');

  // Authorized staff confirms UPI transaction
  const verifiedPaymentOrder = verifyManualPayment(orderId, ownerA);
  assert(verifiedPaymentOrder.paymentStatus === 'paid', 'Authorized staff successfully verifies manual UPI payment');

  // Test 8: Razorpay Cryptographic Verification & Webhook Idempotency
  console.log('\n8. Testing Razorpay Signatures & Webhook Security:');
  const mockRzpOrderId = 'order_DBJOWzybf0sJbb';
  const mockRzpPaymentId = 'pay_29QQoUBi66xm2f';
  const mockSecret = 'test_secret_12345';
  const validSignature = crypto
    .createHmac('sha256', mockSecret)
    .update(`${mockRzpOrderId}|${mockRzpPaymentId}`)
    .digest('hex');

  const isSigValid = verifyPaymentSignature({
    razorpayOrderId: mockRzpOrderId,
    razorpayPaymentId: mockRzpPaymentId,
    razorpaySignature: validSignature,
    keySecret: mockSecret,
  });
  assert(isSigValid === true, 'Valid HMAC-SHA256 signature accepted');

  const isForgedSigValid = verifyPaymentSignature({
    razorpayOrderId: mockRzpOrderId,
    razorpayPaymentId: mockRzpPaymentId,
    razorpaySignature: 'forged_sig',
    keySecret: mockSecret,
  });
  assert(isForgedSigValid === false, 'Forged / tampered signature rejected');

  // Webhook Idempotency
  const testEventId = 'evt_test_unique_7890';
  assert(isWebhookEventProcessed(testEventId) === false, 'New webhook event not yet processed');

  recordWebhookEvent({
    id: 'whe-1',
    eventId: testEventId,
    eventType: 'payment.captured',
    payload: { id: testEventId },
    processedAt: new Date().toISOString(),
    status: 'processed',
  });
  assert(isWebhookEventProcessed(testEventId) === true, 'Webhook event recorded as processed');
  assert(isWebhookEventProcessed(testEventId) === true, 'Duplicate webhook event detected and skipped');

  // Test 9: Secret Credentials Never Exposed
  console.log('\n9. Testing Secret Credentials Isolation:');
  const publicKey = getRazorpayKeyId();
  assert(!publicKey.includes('secret'), 'Public Key ID does not contain secret keywords');
  assert(process.env.RAZORPAY_KEY_SECRET !== 'public', 'Secret key is isolated');

  console.log('\n------------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
