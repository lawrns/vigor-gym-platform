#!/usr/bin/env tsx

/**
 * Test Database Reset Script
 * 
 * This script resets the database to a clean state and seeds it with deterministic test data.
 * Used by E2E tests to ensure consistent test environment.
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Ensure .env.local takes precedence over .env
const localEnv = path.join(process.cwd(), 'apps/api/.env.local');
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

import { PrismaClient } from '../apps/api/src/generated/prisma/index.js';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️ Resetting test database...');

  // Delete all data in reverse dependency order
  await prisma.visit.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.member.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.gym.deleteMany();

  console.log('✅ Database cleared');
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // Create test company
  const testCompany = await prisma.company.create({
    data: {
      name: 'Test Gym Company',
      rfc: 'TEST010101XXX',
      billingEmail: 'billing@testgym.mx',
      timezone: 'America/Mexico_City',
      industry: 'Fitness & Wellness',
    },
  });

  console.log('✅ Created test company:', testCompany.name);

  // Create test admin user
  const adminPasswordHash = await argon2.hash('TestPassword123!');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@testgym.mx',
      passwordHash: adminPasswordHash,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'owner',
      companyId: testCompany.id,
      isActive: true,
    },
  });

  console.log('✅ Created test admin user:', adminUser.email);

  // Create test plans
  const plans = [
    {
      code: 'TEST_BASIC',
      name: 'Test Basic Plan',
      priceType: 'fixed' as const,
      priceMxnCents: 99900, // $999 MXN
      billingCycle: 'monthly' as const,
      stripePriceId: 'price_test_basic',
      featuresJson: {
        features: ['Basic gym access', 'Standard equipment'],
        limits: { monthlyVisits: 30 }
      }
    },
    {
      code: 'TEST_PRO',
      name: 'Test Pro Plan',
      priceType: 'fixed' as const,
      priceMxnCents: 199900, // $1999 MXN
      billingCycle: 'monthly' as const,
      stripePriceId: 'price_test_pro',
      featuresJson: {
        features: ['Premium gym access', 'All equipment', 'Group classes'],
        limits: { monthlyVisits: -1 }
      }
    }
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.create({
      data: planData,
    });
    console.log('✅ Created test plan:', plan.name);
  }

  // Create test members
  const testMembers = [
    {
      firstName: 'Test',
      lastName: 'Member',
      email: 'member@testgym.mx',
      companyId: testCompany.id,
      status: 'active' as const,
    },
    {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@testgym.mx',
      companyId: testCompany.id,
      status: 'active' as const,
    }
  ];

  for (const memberData of testMembers) {
    const member = await prisma.member.create({
      data: memberData,
    });
    console.log('✅ Created test member:', member.firstName, member.lastName);
  }

  // Create test gym
  const testGym = await prisma.gym.create({
    data: {
      name: 'Test Gym Location',
      city: 'Test City',
      state: 'Test State',
      lat: 19.4326,
      lng: -99.1332
    },
  });

  console.log('✅ Created test gym:', testGym.name);

  console.log('🎉 Test data seeding completed!');
}

async function main() {
  try {
    console.log('🚀 Starting test database reset...');
    
    await resetDatabase();
    await seedTestData();
    
    console.log('✅ Test database reset completed successfully!');
    console.log('');
    console.log('Test credentials:');
    console.log('  Email: admin@testgym.mx');
    console.log('  Password: TestPassword123!');
    console.log('');
  } catch (error) {
    console.error('❌ Test database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as resetTestDatabase };
