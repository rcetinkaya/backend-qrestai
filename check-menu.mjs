import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMenu() {
  const menuId = 'cmgj21net000hts4rb58zeygc';
  
  console.log('Searching for menu with ID:', menuId);
  
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      organization: true,
      qr: true,
    }
  });
  
  if (menu) {
    console.log('\n✅ Menu found!');
    console.log('ID:', menu.id);
    console.log('Name:', menu.name);
    console.log('IsActive:', menu.isActive);
    console.log('OrgId:', menu.orgId);
    console.log('Organization:', menu.organization?.name);
    console.log('QR Code:', menu.qr ? `shortId: ${menu.qr.shortId}` : 'No QR code');
  } else {
    console.log('\n❌ Menu NOT found');
    
    // List all menus
    console.log('\nAll menus in database:');
    const allMenus = await prisma.menu.findMany({
      take: 5,
      include: { organization: true, qr: true }
    });
    allMenus.forEach(m => {
      console.log(`- ID: ${m.id}`);
      console.log(`  Name: ${m.name}`);
      console.log(`  Active: ${m.isActive}`);
      console.log(`  Org: ${m.organization?.name}`);
      console.log(`  QR: ${m.qr ? m.qr.shortId : 'none'}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

checkMenu().catch(console.error);
