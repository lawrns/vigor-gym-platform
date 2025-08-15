import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function getPlanId() {
  try {
    const plan = await prisma.plan.findFirst({
      select: { id: true, code: true, name: true }
    });
    console.log('Plan ID:', plan?.id);
    console.log('Plan Code:', plan?.code);
    console.log('Plan Name:', plan?.name);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPlanId();
