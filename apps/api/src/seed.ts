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

// Parse command line arguments
const args = process.argv.slice(2);
const companyName = args.find(arg => arg.startsWith('--company'))?.split('=')[1] || 'DemoCo';
const memberCount = parseInt(args.find(arg => arg.startsWith('--members'))?.split('=')[1] || '85');
const periodDays = parseInt(
  args.find(arg => arg.startsWith('--periodDays'))?.split('=')[1] || '30'
);

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Starting comprehensive database seed for ${companyName}...`);
  console.log(`📊 Configuration: ${memberCount} members, ${periodDays} days of data`);

  // Create demo company
  const demoCompany = await prisma.company.upsert({
    where: { rfc: 'DEMO010101XXX' },
    update: {},
    create: {
      name: `Vigor ${companyName}`,
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

  // Create gyms first
  const gyms = await createGyms(demoCompany.id);

  // Create plans
  const plans = await createPlans();

  // Create staff members
  const staff = await createStaff(demoCompany.id, gyms);

  // Create members with realistic distribution
  const members = await createMembers(demoCompany.id, memberCount, plans);

  // Create staff shifts with intentional gaps
  await createStaffShifts(staff, gyms, periodDays);

  // Create classes for the current week
  await createClasses(gyms, staff, periodDays);

  // Create visits for the last 30 days
  await createVisits(members, gyms, periodDays);

  // Create payments and invoices
  await createPaymentsAndInvoices(members, plans, periodDays);

  console.log('🎉 Comprehensive database seed completed successfully!');
  console.log(`📈 Generated data for ${memberCount} members over ${periodDays} days`);
}

// Helper functions for data generation

async function createGyms(_companyId: string) {
  const gymData = [
    {
      name: 'Vigor Gym Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      lat: 19.4326,
      lng: -99.1332,
    },
    {
      name: 'Vigor Gym Polanco',
      city: 'Ciudad de México',
      state: 'CDMX',
      lat: 19.4326,
      lng: -99.1332,
    },
  ];

  const gyms = [];
  for (const data of gymData) {
    // Check if gym already exists by name
    const existingGym = await prisma.gym.findFirst({
      where: { name: data.name },
    });

    let gym;
    if (existingGym) {
      gym = existingGym;
      console.log('✅ Gym already exists:', gym.name);
    } else {
      gym = await prisma.gym.create({
        data: data,
      });
      console.log('✅ Created gym:', gym.name);
    }
    gyms.push(gym);
  }
  return gyms;
}

async function createPlans() {
  const planData = [
    {
      code: 'TP_ON',
      name: 'TP ON',
      priceType: 'fixed' as const,
      priceMxnCents: 99900, // $999 MXN
      billingCycle: 'monthly' as const,
      stripePriceId: process.env.STRIPE_PRICE_TP_ON || 'price_test_tp_on',
      featuresJson: {
        features: ['Basic gym access', 'Standard equipment'],
        limits: { monthlyVisits: 30 },
      },
    },
    {
      code: 'TP_PRO',
      name: 'TP PRO',
      priceType: 'fixed' as const,
      priceMxnCents: 199900, // $1999 MXN
      billingCycle: 'monthly' as const,
      stripePriceId: process.env.STRIPE_PRICE_TP_PRO || 'price_test_tp_pro',
      featuresJson: {
        features: ['Premium gym access', 'All equipment', 'Group classes'],
        limits: { monthlyVisits: -1 },
      },
    },
    {
      code: 'TP_PLUS',
      name: 'TP+',
      priceType: 'custom' as const,
      priceMxnCents: 299900, // $2999 MXN
      billingCycle: 'monthly' as const,
      stripePriceId: process.env.STRIPE_PRICE_TP_PLUS || 'price_test_tp_plus',
      featuresJson: {
        features: ['Custom plan', 'Personalized training', 'Nutrition consulting'],
        limits: { monthlyVisits: -1 },
      },
    },
  ];

  const plans = [];
  for (const data of planData) {
    const plan = await prisma.plan.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    });
    plans.push(plan);
    console.log('✅ Created plan:', plan.name);
  }
  return plans;
}

async function createStaff(companyId: string, _gyms: any[]) {
  const staffData: Array<{
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'TRAINER' | 'RECEPTIONIST' | 'MANAGER' | 'MAINTENANCE';
  }> = [
    {
      firstName: 'Roberto',
      lastName: 'Manager',
      email: 'roberto.manager@demo.mx',
      role: 'MANAGER',
    },
    { firstName: 'Carlos', lastName: 'Trainer', email: 'carlos.trainer@demo.mx', role: 'TRAINER' },
    { firstName: 'Ana', lastName: 'Trainer', email: 'ana.trainer@demo.mx', role: 'TRAINER' },
    { firstName: 'Luis', lastName: 'Trainer', email: 'luis.trainer@demo.mx', role: 'TRAINER' },
    {
      firstName: 'María',
      lastName: 'Recepción',
      email: 'maria.recepcion@demo.mx',
      role: 'RECEPTIONIST',
    },
    {
      firstName: 'José',
      lastName: 'Recepción',
      email: 'jose.recepcion@demo.mx',
      role: 'RECEPTIONIST',
    },
    {
      firstName: 'Pedro',
      lastName: 'Mantenimiento',
      email: 'pedro.mant@demo.mx',
      role: 'MAINTENANCE',
    },
  ];

  const staff = [];
  for (const data of staffData) {
    const staffMember = await prisma.staff.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        companyId,
        active: true,
      },
    });
    staff.push(staffMember);
    console.log(
      '✅ Created staff:',
      staffMember.firstName,
      staffMember.lastName,
      `(${staffMember.role})`
    );
  }
  return staff;
}

async function createMembers(companyId: string, count: number, plans: any[]) {
  const firstNames = [
    'Ana',
    'Carlos',
    'María',
    'José',
    'Laura',
    'Miguel',
    'Carmen',
    'Francisco',
    'Isabel',
    'Antonio',
    'Rosa',
    'Manuel',
    'Pilar',
    'Jesús',
    'Dolores',
    'Alejandro',
    'Mercedes',
    'Rafael',
    'Lucía',
    'Ángel',
  ];
  const lastNames = [
    'García',
    'López',
    'Martínez',
    'González',
    'Rodríguez',
    'Fernández',
    'Sánchez',
    'Pérez',
    'Gómez',
    'Martín',
    'Jiménez',
    'Ruiz',
    'Hernández',
    'Díaz',
    'Moreno',
    'Muñoz',
    'Álvarez',
    'Romero',
    'Alonso',
    'Gutiérrez',
  ];

  const statusDistribution = {
    active: 0.74,
    invited: 0.06,
    paused: 0.08,
    cancelled: 0.12,
  };

  const members = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@demo.mx`;

    // Determine status based on distribution
    const rand = Math.random();
    let status = 'active';
    let cumulative = 0;
    for (const [statusKey, probability] of Object.entries(statusDistribution)) {
      cumulative += probability;
      if (rand <= cumulative) {
        status = statusKey;
        break;
      }
    }

    const member = await prisma.member.upsert({
      where: { email },
      update: {},
      create: {
        firstName,
        lastName,
        email,
        companyId,
        status: status as any,
      },
    });

    // Create membership for active members
    if (status === 'active') {
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() - Math.floor(Math.random() * 180)); // Random start in last 180 days

      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + (Math.random() > 0.7 ? 90 : 30)); // 30% get 90-day memberships

      // Check if membership already exists
      const existingMembership = await prisma.membership.findFirst({
        where: {
          memberId: member.id,
          planId: plan.id,
          companyId,
        },
      });

      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            companyId,
            status: 'active',
            startsAt,
            endsAt,
          },
        });
      }
    }

    members.push(member);
    if (i % 10 === 0) {
      console.log(`✅ Created ${i + 1}/${count} members...`);
    }
  }
  console.log(`✅ Created ${count} members with realistic status distribution`);
  return members;
}

async function createStaffShifts(staff: any[], gyms: any[], _days: number) {
  // Create shifts for the last week with intentional gaps
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const gym of gyms) {
      // Create shifts based on day type
      if (isWeekend) {
        // Weekend: reduced coverage
        const receptionist = staff.find(s => s.role === 'RECEPTIONIST');
        if (receptionist) {
          await createShift(receptionist, gym, currentDate, 8, 20, 'Turno fin de semana');
        }
      } else {
        // Weekday: full coverage with intentional gaps
        const manager = staff.find(s => s.role === 'MANAGER');
        const trainers = staff.filter(s => s.role === 'TRAINER');
        const receptionists = staff.filter(s => s.role === 'RECEPTIONIST');

        // Manager shift
        if (manager) {
          await createShift(manager, gym, currentDate, 9, 18, 'Gestión diaria');
        }

        // Receptionist shifts with gap
        if (receptionists.length >= 2) {
          await createShift(receptionists[0], gym, currentDate, 6, 14, 'Turno mañana');
          // Intentional gap: 14:00-16:00 on Tuesday at Polanco
          if (dayOfWeek === 2 && gym.name.includes('Polanco')) {
            await createShift(
              receptionists[1],
              gym,
              currentDate,
              16,
              22,
              'Turno tarde (con hueco)'
            );
          } else {
            await createShift(receptionists[1], gym, currentDate, 14, 22, 'Turno tarde');
          }
        }

        // Trainer shifts with gap
        if (trainers.length >= 2) {
          await createShift(trainers[0], gym, currentDate, 8, 16, 'Clases matutinas');
          // Intentional gap: 18:00-20:00 on Thursday at Centro
          if (dayOfWeek === 4 && gym.name.includes('Centro')) {
            await createShift(
              trainers[1],
              gym,
              currentDate,
              20,
              21,
              'Clases nocturnas (con hueco)'
            );
          } else {
            await createShift(trainers[1], gym, currentDate, 18, 21, 'Clases vespertinas');
          }
        }
      }
    }
  }
  console.log('✅ Created staff shifts with intentional coverage gaps');
}

async function createShift(
  staff: any,
  gym: any,
  date: Date,
  startHour: number,
  endHour: number,
  notes?: string
) {
  const startTime = new Date(date);
  startTime.setHours(startHour, 0, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, 0, 0, 0);

  // Check if shift already exists
  const existingShift = await prisma.staffShift.findFirst({
    where: {
      staffId: staff.id,
      startTime,
      gymId: gym.id,
    },
  });

  if (!existingShift) {
    await prisma.staffShift.create({
      data: {
        staffId: staff.id,
        gymId: gym.id,
        startTime,
        endTime,
        notes,
      },
    });
  }
}

async function createClasses(gyms: any[], staff: any[], _days: number) {
  const classTemplates = [
    { name: 'HIIT 45', durationMin: 45, capacity: 22 },
    { name: 'Yoga Flow', durationMin: 60, capacity: 18 },
    { name: 'Powerlifting', durationMin: 60, capacity: 16 },
    { name: 'Spinning', durationMin: 50, capacity: 24 },
    { name: 'Mobility', durationMin: 45, capacity: 16 },
  ];

  const trainers = staff.filter(s => s.role === 'TRAINER');
  const today = new Date();

  // Create classes for current week
  for (let day = 0; day < 7; day++) {
    const classDate = new Date(today);
    classDate.setDate(classDate.getDate() - 3 + day); // 3 days ago to 3 days ahead

    for (const gym of gyms) {
      // 5 classes per gym per day
      for (let i = 0; i < 5; i++) {
        const template = classTemplates[i];
        const trainer = trainers[Math.floor(Math.random() * trainers.length)];

        const startTime = new Date(classDate);
        startTime.setHours(8 + i * 2, 0, 0, 0); // Classes every 2 hours starting at 8 AM

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + template.durationMin);

        // Check if class already exists
        const existingClass = await prisma.class.findFirst({
          where: {
            gymId: gym.id,
            startsAt: startTime,
            title: template.name,
          },
        });

        if (!existingClass) {
          await prisma.class.create({
            data: {
              title: template.name,
              capacity: template.capacity,
              startsAt: startTime,
              gymId: gym.id,
            },
          });
        }
      }
    }
  }
  console.log('✅ Created weekly class schedule');
}

async function createVisits(members: any[], gyms: any[], days: number) {
  const today = new Date();
  let totalVisits = 0;

  for (let day = 0; day < days; day++) {
    const visitDate = new Date(today);
    visitDate.setDate(visitDate.getDate() - day);
    const dayOfWeek = visitDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const gym of gyms) {
      // Calculate daily volume based on gym type and day type
      const baseVolume = (gym.name.includes('Centro') ? 120 : 90) * (isWeekend ? 0.7 : 1.0);
      const dailyVisits = Math.floor(baseVolume * (0.8 + Math.random() * 0.4)); // 80-120% of base

      for (let v = 0; v < dailyVisits; v++) {
        const member = members[Math.floor(Math.random() * members.length)];

        // Only create visits for members with active memberships
        const membership = await prisma.membership.findFirst({
          where: {
            memberId: member.id,
            status: 'active',
          },
        });

        if (!membership) continue;

        // Generate visit time based on diurnal curve
        const hour = generateVisitHour();
        const minute = Math.floor(Math.random() * 60);

        const checkinTime = new Date(visitDate);
        checkinTime.setHours(hour, minute, 0, 0);

        const duration = Math.max(20, Math.min(120, Math.floor(58 + (Math.random() - 0.5) * 36))); // Normal distribution around 58 min
        const checkoutTime = new Date(checkinTime);
        checkoutTime.setMinutes(checkoutTime.getMinutes() + duration);

        await prisma.visit.create({
          data: {
            membershipId: membership.id,
            gymId: gym.id,
            checkIn: checkinTime,
            checkOut: checkoutTime,
          },
        });
        totalVisits++;
      }
    }
  }
  console.log(`✅ Created ${totalVisits} visits over ${days} days`);
}

function generateVisitHour(): number {
  // Diurnal curve weights
  const weights = [
    0, 0, 0, 0, 0, 0, 0.5, 0.8, 0.9, 0.7, 0.4, 0.4, 0.65, 0.7, 0.6, 0.5, 0.6, 0.9, 1.0, 0.95, 0.7,
    0.4, 0.2, 0.1,
  ];

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let hour = 0; hour < 24; hour++) {
    random -= weights[hour];
    if (random <= 0) {
      return hour;
    }
  }
  return 18; // Default to peak hour
}

async function createPaymentsAndInvoices(members: any[], plans: any[], days: number) {
  const today = new Date();
  let totalPayments = 0;

  for (let day = 0; day < days * 2; day++) {
    // 60 days of payment history
    const paymentDate = new Date(today);
    paymentDate.setDate(paymentDate.getDate() - day);

    // Generate 3-8 payments per day
    const dailyPayments = 3 + Math.floor(Math.random() * 6);

    for (let p = 0; p < dailyPayments; p++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const plan = plans[Math.floor(Math.random() * plans.length)];

      // Determine payment status (82% success, 14% failed, 4% refunded)
      const rand = Math.random();
      let status: 'requires_action' | 'succeeded' | 'failed' | 'refunded' = 'succeeded';
      if (rand > 0.96) status = 'refunded';
      else if (rand > 0.82) status = 'failed';

      // Generate amount with log-normal distribution
      const baseAmount = plan.priceMxnCents;
      const variation = 0.8 + Math.random() * 0.4; // ±20% variation
      const amount = Math.floor(baseAmount * variation);

      // Create invoice first
      const invoice = await prisma.invoice.create({
        data: {
          companyId: member.companyId,
          totalMxnCents: amount,
          status: status === 'succeeded' ? 'paid' : status === 'failed' ? 'issued' : 'void',
          createdAt: paymentDate,
        },
      });

      // Create payment linked to invoice
      const payment = await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          paidMxnCents: status === 'succeeded' ? amount : 0,
          status,
          provider: Math.random() > 0.5 ? 'stripe' : 'mercadopago',
          providerRef: `${Math.random() > 0.5 ? 'stripe' : 'mp'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: paymentDate,
        },
      });

      totalPayments++;
    }
  }
  console.log(
    `✅ Created ${totalPayments} payments and invoices with realistic success/failure rates`
  );
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
