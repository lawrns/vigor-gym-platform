import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Ensure .env.local takes precedence over .env
const localEnv = path.join(process.cwd(), '.env.local');
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

import { PrismaClient } from './generated/prisma/index.js';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting minimal database seed...');

  // Create demo company
  const demoCompany = await prisma.company.upsert({
    where: { rfc: 'DEMO010101XXX' },
    update: {},
    create: {
      name: 'Vigor Demo Gym',
      rfc: 'DEMO010101XXX',
      billingEmail: 'admin@testgym.mx',
      timezone: 'America/Mexico_City',
      industry: 'Fitness & Wellness',
    },
  });

  console.log('✅ Created demo company:', demoCompany.name);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@testgym.mx' },
    update: {},
    create: {
      email: 'admin@testgym.mx',
      passwordHash: await argon2.hash('TestPassword123!'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'owner',
      companyId: demoCompany.id,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create one gym
  const existingGym = await prisma.gym.findFirst({
    where: { name: 'Vigor Gym Demo' },
  });

  const gym = existingGym || await prisma.gym.create({
    data: {
      name: 'Vigor Gym Demo',
      city: 'Mexico City',
      state: 'CDMX',
      lat: 19.4326, // Mexico City coordinates
      lng: -99.1332,
    },
  });

  console.log('✅ Created gym:', gym.name);

  // Create basic plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { code: 'BASIC' },
      update: {},
      create: {
        code: 'BASIC',
        name: 'Basic Plan',
        priceType: 'fixed',
        priceMxnCents: 50000, // $500 MXN
        billingCycle: 'monthly',
      },
    }),
    prisma.plan.upsert({
      where: { code: 'PREMIUM' },
      update: {},
      create: {
        code: 'PREMIUM',
        name: 'Premium Plan',
        priceType: 'fixed',
        priceMxnCents: 80000, // $800 MXN
        billingCycle: 'monthly',
      },
    }),
  ]);

  console.log('✅ Created plans:', plans.map(p => p.name).join(', '));

  // Create 5 demo members
  const members = [];
  for (let i = 1; i <= 5; i++) {
    const member = await prisma.member.upsert({
      where: { email: `member${i}@demo.mx` },
      update: {},
      create: {
        email: `member${i}@demo.mx`,
        firstName: `Member`,
        lastName: `${i}`,
        status: 'active',
        companyId: demoCompany.id,
      },
    });
    members.push(member);
  }

  console.log('✅ Created 5 demo members');

  // Create memberships for members
  for (const member of members) {
    await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plans[0].id, // Basic plan
        status: 'active',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        companyId: demoCompany.id,
      },
    });
  }

  console.log('✅ Created memberships for all members');

  console.log('🎉 Minimal seed completed successfully!');
  console.log('📊 Summary:');
  console.log('  - 1 company');
  console.log('  - 1 admin user (admin@testgym.mx / TestPassword123!)');
  console.log('  - 1 gym');
  console.log('  - 2 plans');
  console.log('  - 5 members with active memberships');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
