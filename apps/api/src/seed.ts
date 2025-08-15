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
  console.log('🌱 Starting database seed...');

  // Create demo company
  const demoCompany = await prisma.company.upsert({
    where: { rfc: 'DEMO010101XXX' },
    update: {},
    create: {
      name: 'Vigor Demo Co',
      rfc: 'DEMO010101XXX',
      billingEmail: 'finanzas@demo.mx',
      timezone: 'America/Mexico_City',
      industry: 'Fitness & Wellness',
    },
  });

  console.log('✅ Created demo company:', demoCompany.name, '(ID:', demoCompany.id + ')');

  // Create admin user for the demo company
  const adminPasswordHash = await argon2.hash('TestPassword123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@testgym.mx' },
    update: {
      passwordHash: adminPasswordHash, // Update password in case it changed
    },
    create: {
      email: 'admin@testgym.mx',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'owner',
      companyId: demoCompany.id,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email, '(ID:', adminUser.id + ')');

  // Create plans
  const plans = [
    {
      code: 'TP_ON',
      name: 'TP ON',
      priceType: 'fixed' as const,
      priceMxnCents: 0,
      billingCycle: 'monthly' as const,
      featuresJson: {
        features: ['Basic gym access', 'Standard equipment'],
        limits: { monthlyVisits: 30 }
      }
    },
    {
      code: 'TP_PRO',
      name: 'TP PRO',
      priceType: 'fixed' as const,
      priceMxnCents: 0,
      billingCycle: 'monthly' as const,
      featuresJson: {
        features: ['Premium gym access', 'All equipment', 'Group classes'],
        limits: { monthlyVisits: -1 }
      }
    },
    {
      code: 'TP_PLUS',
      name: 'TP+',
      priceType: 'custom' as const,
      priceMxnCents: null,
      billingCycle: 'custom' as const,
      featuresJson: {
        features: ['Custom plan', 'Personalized training', 'Nutrition consulting'],
        limits: { monthlyVisits: -1 }
      }
    }
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { code: planData.code },
      update: {},
      create: planData,
    });
    console.log('✅ Created plan:', plan.name);
  }

  // Create sample members
  const memberNames = [
    { firstName: 'Ana', lastName: 'García', email: 'ana.garcia@demo.mx' },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@demo.mx' },
    { firstName: 'María', lastName: 'Rodríguez', email: 'maria.rodriguez@demo.mx' },
    { firstName: 'José', lastName: 'Martínez', email: 'jose.martinez@demo.mx' },
    { firstName: 'Laura', lastName: 'Hernández', email: 'laura.hernandez@demo.mx' }
  ];

  for (const memberData of memberNames) {
    const member = await prisma.member.upsert({
      where: { email: memberData.email },
      update: {},
      create: {
        ...memberData,
        companyId: demoCompany.id,
        status: 'active',
      },
    });
    console.log('✅ Created member:', member.firstName, member.lastName);
  }

  // Create sample gyms
  const gyms = [
    {
      name: 'Vigor Gym Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      lat: 19.4326,
      lng: -99.1332
    },
    {
      name: 'Vigor Gym Norte',
      city: 'Guadalajara',
      state: 'Jalisco',
      lat: 20.6597,
      lng: -103.3496
    }
  ];

  for (const gymData of gyms) {
    // Check if gym already exists by name
    const existingGym = await prisma.gym.findFirst({
      where: { name: gymData.name }
    });

    if (!existingGym) {
      const gym = await prisma.gym.create({
        data: gymData,
      });
      console.log('✅ Created gym:', gym.name);
    } else {
      console.log('✅ Gym already exists:', existingGym.name);
    }
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
