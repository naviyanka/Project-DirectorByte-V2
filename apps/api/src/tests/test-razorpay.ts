/**
 * Razorpay Integration Test Script
 * ----------------------------------
 * Tests the Razorpay gateway using test API keys.
 * Run with: npx ts-node src/tests/test-razorpay.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Razorpay from 'razorpay';

async function testRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env');
    process.exit(1);
  }

  console.warn('🔑 Using Razorpay Key ID:', keyId);
  console.warn('---');

  const rz = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // Test 1: Create a Plan
  console.warn('\n📋 Test 1: Creating a subscription plan...');
  try {
    const plan = await (rz.plans as any).create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'DirectorByte Pro (Test)',
        amount: 99900, // ₹999 in paise
        currency: 'INR',
      },
    });
    console.warn('✅ Plan created:', plan.id);
    console.warn('   Name:', plan.item.name);
    console.warn('   Amount:', plan.item.amount / 100, plan.item.currency);

    // Test 2: Create a Subscription from that Plan
    console.warn('\n📋 Test 2: Creating a subscription...');
    const subscription = await (rz.subscriptions as any).create({
      plan_id: plan.id,
      total_count: 12,
      notes: {
        userId: 'test_user_123',
        planId: 'test_plan_pro',
      },
    });
    console.warn('✅ Subscription created:', subscription.id);
    console.warn('   Status:', subscription.status);
    console.warn('   Short URL:', subscription.short_url);
    console.warn('   (This URL can be opened in a browser to test the checkout flow)');

    // Test 3: Fetch the subscription back
    console.warn('\n📋 Test 3: Fetching subscription...');
    const fetched = await (rz.subscriptions as any).fetch(subscription.id);
    console.warn('✅ Subscription fetched:', fetched.id);
    console.warn('   Status:', fetched.status);
    console.warn('   Plan ID:', fetched.plan_id);

    // Test 4: Cancel the subscription
    console.warn('\n📋 Test 4: Cancelling subscription...');
    const cancelled = await (rz.subscriptions as any).cancel(subscription.id);
    console.warn('✅ Subscription cancelled:', cancelled.id);
    console.warn('   Status:', cancelled.status);

    console.warn('\n═══════════════════════════════');
    console.warn('🎉 All Razorpay tests PASSED!');
    console.warn('═══════════════════════════════');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
    if (error.statusCode) console.error('   HTTP Status:', error.statusCode);
    if (error.error) console.error('   Details:', JSON.stringify(error.error, null, 2));
    process.exit(1);
  }
}

testRazorpay();
