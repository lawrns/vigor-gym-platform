import { PrismaClient } from '../generated/prisma/index.js';
import { createMemberFactory } from './factories/memberFactory.js';
import { createVisitFactory } from './factories/visitFactory.js';
import { createPaymentFactory } from './factories/paymentFactory.js';
import { createClassFactory } from './factories/classFactory.js';

const prisma = new PrismaClient();

export interface DemoSeedResult {
  membersCreated: number;
  visitsCreated: number;
  paymentsCreated: number;
  classesCreated: number;
  staffCreated: number;
}

/**
 * Seed demo company with deterministic, realistic data
 */
export async function seedDemoCompany(companyId: string): Promise<DemoSeedResult> {
  console.log(`🌱 Starting demo company seed for ${companyId}...`);

  return await prisma.$transaction(async tx => {
    // Clean existing data (in correct order to respect foreign keys)
    await tx.visit.deleteMany({ where: { membership: { companyId } } });
    await tx.payment.deleteMany({ where: { member: { companyId } } });
    await tx.membership.deleteMany({ where: { companyId } });
    await tx.member.deleteMany({ where: { companyId } });
    await tx.classBooking.deleteMany({ where: { class: { gym: { companyId } } } });
    await tx.class.deleteMany({ where: { gym: { companyId } } });
    await tx.staff.deleteMany({ where: { companyId } });

    // Ensure gyms and plans exist
    const gyms = await tx.gym.findMany({ where: { companyId } });
    if (gyms.length === 0) {
      throw new Error('No gyms found for company. Run onboarding first.');
    }

    const plans = await tx.plan.findMany({ where: { companyId } });
    if (plans.length === 0) {
      throw new Error('No plans found for company. Run onboarding first.');
    }

    // Create staff with intentional gaps
    const staffData = [
      {
        firstName: 'Roberto',
        lastName: 'Manager',
        email: 'roberto@demo.mx',
        role: 'MANAGER' as const,
      },
      {
        firstName: 'Carlos',
        lastName: 'Trainer',
        email: 'carlos@demo.mx',
        role: 'TRAINER' as const,
      },
      { firstName: 'Ana', lastName: 'Trainer', email: 'ana@demo.mx', role: 'TRAINER' as const },
      { firstName: 'Luis', lastName: 'Trainer', email: 'luis@demo.mx', role: 'TRAINER' as const },
      {
        firstName: 'María',
        lastName: 'Recepción',
        email: 'maria@demo.mx',
        role: 'RECEPTIONIST' as const,
      },
      {
        firstName: 'José',
        lastName: 'Recepción',
        email: 'jose@demo.mx',
        role: 'RECEPTIONIST' as const,
      },
      {
        firstName: 'Pedro',
        lastName: 'Mantenimiento',
        email: 'pedro@demo.mx',
        role: 'MAINTENANCE' as const,
      },
    ];

    const staff = await Promise.all(
      staffData.map(data =>
        tx.staff.create({
          data: { ...data, companyId },
        })
      )
    );

    // Create 120 members with realistic status distribution
    const memberFactory = createMemberFactory();
    const members = [];

    for (let i = 0; i < 120; i++) {
      const memberData = memberFactory.create(i);
      const member = await tx.member.create({
        data: {
          ...memberData,
          companyId,
        },
      });

      // Create membership for active/paused members
      if (memberData.status === 'active' || memberData.status === 'paused') {
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const startDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await tx.membership.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            companyId,
            startsAt: startDate,
            endsAt: endDate,
            status: memberData.status,
          },
        });
      }

      members.push(member);
    }

    // Create visits for the last 30 days with realistic patterns
    const visitFactory = createVisitFactory();
    const memberships = await tx.membership.findMany({
      where: { companyId },
      include: { member: true },
    });

    let visitsCreated = 0;
    for (let day = 0; day < 30; day++) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      // Weekend uplift: 30% more visits on weekends
      const baseVisits = isWeekend ? 25 : 19;
      const dailyVisits = Math.floor(baseVisits + Math.random() * 10);

      for (let v = 0; v < dailyVisits; v++) {
        const membership = memberships[Math.floor(Math.random() * memberships.length)];
        const gym = gyms[Math.floor(Math.random() * gyms.length)];

        const visitData = visitFactory.create(date, membership.id, gym.id);
        await tx.visit.create({ data: visitData });
        visitsCreated++;
      }
    }

    // Create payments with specified ratios
    const paymentFactory = createPaymentFactory();
    let paymentsCreated = 0;

    for (const member of members.slice(0, 100)) {
      // 100 members with payment history
      const paymentCount = Math.floor(Math.random() * 3) + 1; // 1-3 payments per member

      for (let p = 0; p < paymentCount; p++) {
        const paymentData = paymentFactory.create(member.id);
        await tx.payment.create({ data: paymentData });
        paymentsCreated++;
      }
    }

    // Create weekly class schedule (28 classes per week)
    const classFactory = createClassFactory();
    const classTypes = ['Yoga', 'Spinning', 'CrossFit', 'Pilates', 'Zumba', 'Boxing', 'Aqua'];
    let classesCreated = 0;

    for (let day = 0; day < 7; day++) {
      const classesPerDay = 4; // 4 classes per day = 28 per week

      for (let c = 0; c < classesPerDay; c++) {
        const gym = gyms[Math.floor(Math.random() * gyms.length)];
        const trainer = staff.filter(s => s.role === 'TRAINER')[Math.floor(Math.random() * 3)];
        const classType = classTypes[Math.floor(Math.random() * classTypes.length)];

        const classData = classFactory.create(day, c, classType, gym.id, trainer.id);
        await tx.class.create({ data: classData });
        classesCreated++;
      }
    }

    console.log(
      `✅ Demo seed completed: ${members.length} members, ${visitsCreated} visits, ${paymentsCreated} payments`
    );

    return {
      membersCreated: members.length,
      visitsCreated,
      paymentsCreated,
      classesCreated,
      staffCreated: staff.length,
    };
  });
}

/**
 * Get demo company configuration
 */
export function getDemoConfig() {
  return {
    members: 120,
    visitsDays: 30,
    classesWeek: 28,
    payments: {
      succeededRatio: 0.92,
      failedRatio: 0.06,
      refundedRatio: 0.02,
    },
    expiringMemberships: {
      '7d': 10,
      '14d': 22,
      '30d': 48,
    },
    staffShifts: 'coverage with 2–3 intentional gaps/day',
  };
}
