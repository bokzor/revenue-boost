import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.session.count();
    console.log('✅ Session table exists! Count:', count);

    const storeCount = await prisma.store.count();
    console.log('✅ Store table exists! Count:', storeCount);

    console.log('\n✅ All tables are working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

