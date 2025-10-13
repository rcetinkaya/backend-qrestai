/**
 * Database Seed Script
 * Run with: npm run prisma:seed or npx tsx prisma/seed.ts
 */

import { PrismaClient, Plan, Role, OrgStatus } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Hash password for all test users
  const hashedPassword = await bcryptjs.hash('Password123!', 10);

  // 0. Create Subscription Plans
  console.log('💳 Creating subscription plans...');

  await prisma.subscriptionPlan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: 'Free Plan',
      description: 'Perfect for trying out QRestAI. Create your first digital menu and experience the basics.',
      price: 0,
      currency: 'USD',
      maxMenus: 1,
      maxItems: 20,
      maxTeamMembers: 1,
      aiCreditsMonthly: 50,
      hasQrCustomization: false,
      hasAdvancedAnalytics: false,
      hasApiAccess: false,
      hasWhiteLabel: false,
      hasPrioritySupport: false,
      isActive: true,
      isPublic: true,
      sortOrder: 0,
      features: ['1 Menu', '20 Items', 'Basic QR Code', '50 AI Credits/month', 'Basic Analytics'],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'STARTER' },
    update: {},
    create: {
      name: 'STARTER',
      displayName: 'Starter Plan',
      description: 'Ideal for small restaurants and cafes looking to digitize their menu with AI-powered features.',
      price: 9.99,
      currency: 'USD',
      maxMenus: 3,
      maxItems: 100,
      maxTeamMembers: 3,
      aiCreditsMonthly: 500,
      hasQrCustomization: true,
      hasAdvancedAnalytics: false,
      hasApiAccess: false,
      hasWhiteLabel: false,
      hasPrioritySupport: false,
      isActive: true,
      isPublic: true,
      sortOrder: 1,
      features: ['3 Menus', '100 Items', 'Custom QR Design', '500 AI Credits/month', 'Up to 3 Team Members', 'Multi-language Support'],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: {
      name: 'PRO',
      displayName: 'Professional Plan',
      description: 'For established restaurants requiring unlimited menus and advanced AI capabilities.',
      price: 29.99,
      currency: 'USD',
      maxMenus: -1,
      maxItems: -1,
      maxTeamMembers: 10,
      aiCreditsMonthly: 2500,
      hasQrCustomization: true,
      hasAdvancedAnalytics: true,
      hasApiAccess: false,
      hasWhiteLabel: false,
      hasPrioritySupport: true,
      isActive: true,
      isPublic: true,
      sortOrder: 2,
      features: ['Unlimited Menus', 'Unlimited Items', 'Custom QR Design', '2,500 AI Credits/month', 'Up to 10 Team Members', 'Advanced Analytics', 'Priority Support'],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'BUSINESS' },
    update: {},
    create: {
      name: 'BUSINESS',
      displayName: 'Business Plan',
      description: 'Enterprise-grade solution for restaurant chains and multi-location businesses.',
      price: 79.99,
      currency: 'USD',
      maxMenus: -1,
      maxItems: -1,
      maxTeamMembers: -1,
      aiCreditsMonthly: 10000,
      hasQrCustomization: true,
      hasAdvancedAnalytics: true,
      hasApiAccess: true,
      hasWhiteLabel: true,
      hasPrioritySupport: true,
      isActive: true,
      isPublic: true,
      sortOrder: 3,
      features: ['Unlimited Everything', '10,000 AI Credits/month', 'Unlimited Team Members', 'API Access', 'White Label', 'Advanced Analytics', 'Priority Support', 'Custom Integrations'],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'ENTERPRISE',
      displayName: 'Enterprise Plan',
      description: 'Fully customized solution with dedicated support and unlimited resources.',
      price: 0,
      currency: 'USD',
      maxMenus: -1,
      maxItems: -1,
      maxTeamMembers: -1,
      aiCreditsMonthly: -1,
      hasQrCustomization: true,
      hasAdvancedAnalytics: true,
      hasApiAccess: true,
      hasWhiteLabel: true,
      hasPrioritySupport: true,
      isActive: true,
      isPublic: false,
      sortOrder: 4,
      features: ['Custom Everything', 'Unlimited AI Credits', 'Dedicated Account Manager', 'Custom SLA', 'On-premise Option', 'Custom Development'],
      metadata: { contactSales: true },
    },
  });

  // Create Credit Packages
  await prisma.creditPackage.upsert({
    where: { id: 'pkg-500' },
    update: {},
    create: {
      id: 'pkg-500',
      name: '500 AI Credits',
      credits: 500,
      price: 4.99,
      discount: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  await prisma.creditPackage.upsert({
    where: { id: 'pkg-2500' },
    update: {},
    create: {
      id: 'pkg-2500',
      name: '2,500 AI Credits',
      credits: 2500,
      price: 19.99,
      discount: 20,
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.creditPackage.upsert({
    where: { id: 'pkg-5000' },
    update: {},
    create: {
      id: 'pkg-5000',
      name: '5,000 AI Credits',
      credits: 5000,
      price: 34.99,
      discount: 30,
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.creditPackage.upsert({
    where: { id: 'pkg-10000' },
    update: {},
    create: {
      id: 'pkg-10000',
      name: '10,000 AI Credits',
      credits: 10000,
      price: 59.99,
      discount: 40,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log('✅ Subscription plans and credit packages created');

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@qrestai.com' },
    update: {},
    create: {
      email: 'admin@qrestai.com',
      password: hashedPassword,
      name: 'QRestAI Admin',
      emailVerified: true,
    },
  });

  // 2. Create QRestAI Organization (for admin)
  const qrestaiOrg = await prisma.organization.upsert({
    where: { slug: 'qrestai' },
    update: {},
    create: {
      name: 'QRestAI',
      slug: 'qrestai',
      plan: Plan.BUSINESS,
      status: OrgStatus.ACTIVE,
      aiCredits: 999999,
      aiCreditsUsed: 0,
    },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_orgId: {
        userId: adminUser.id,
        orgId: qrestaiOrg.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      orgId: qrestaiOrg.id,
      role: Role.OWNER,
    },
  });
  console.log('✅ Admin user & QRestAI org created');

  // 3. Create Demo Restaurant
  console.log('\n🍽️  Creating Demo Restaurant...');
  const demoOwner = await prisma.user.upsert({
    where: { email: 'demo@restaurant.com' },
    update: {},
    create: {
      email: 'demo@restaurant.com',
      password: hashedPassword,
      name: 'Demo Owner',
      emailVerified: true,
    },
  });

  const demoRestaurant = await prisma.organization.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      plan: Plan.PRO,
      status: OrgStatus.ACTIVE,
      aiCredits: 5000,
      aiCreditsUsed: 0,
    },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_orgId: {
        userId: demoOwner.id,
        orgId: demoRestaurant.id,
      },
    },
    update: {},
    create: {
      userId: demoOwner.id,
      orgId: demoRestaurant.id,
      role: Role.OWNER,
    },
  });

  // Create team members
  const demoEditor = await prisma.user.upsert({
    where: { email: 'editor@restaurant.com' },
    update: {},
    create: {
      email: 'editor@restaurant.com',
      password: hashedPassword,
      name: 'Menu Editor',
      emailVerified: true,
    },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_orgId: {
        userId: demoEditor.id,
        orgId: demoRestaurant.id,
      },
    },
    update: {},
    create: {
      userId: demoEditor.id,
      orgId: demoRestaurant.id,
      role: Role.EDITOR,
    },
  });

  // Create full menu
  const mainMenu = await prisma.menu.create({
    data: {
      orgId: demoRestaurant.id,
      name: 'Main Menu',
      locale: 'en',
      isActive: true,
    },
  });

  const appetizers = await prisma.category.create({
    data: {
      menuId: mainMenu.id,
      name: 'Appetizers',
      description: 'Start your meal',
      sortOrder: 0,
    },
  });

  const mains = await prisma.category.create({
    data: {
      menuId: mainMenu.id,
      name: 'Main Courses',
      description: 'Signature dishes',
      sortOrder: 1,
    },
  });

  const desserts = await prisma.category.create({
    data: {
      menuId: mainMenu.id,
      name: 'Desserts',
      description: 'Sweet endings',
      sortOrder: 2,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      { categoryId: appetizers.id, name: 'Caesar Salad', price: 8.99, isAvailable: true, sortOrder: 0 },
      { categoryId: appetizers.id, name: 'Bruschetta', price: 7.99, isAvailable: true, sortOrder: 1 },
      { categoryId: mains.id, name: 'Grilled Salmon', price: 24.99, isAvailable: true, sortOrder: 0 },
      { categoryId: mains.id, name: 'Ribeye Steak', price: 32.99, isAvailable: true, sortOrder: 1 },
      { categoryId: desserts.id, name: 'Tiramisu', price: 7.99, isAvailable: true, sortOrder: 0 },
    ],
  });

  await prisma.qrCode.create({
    data: {
      menuId: mainMenu.id,
      shortId: 'demo-main',
      styleJson: {
        foreground: '#000000',
        background: '#FFFFFF',
        errorCorrection: 'M',
      },
    },
  });

  console.log('✅ Demo Restaurant created with menu');

  // 4. Create Turkish Restaurant
  console.log('\n🥙 Creating Turkish Restaurant...');
  const turkishOwner = await prisma.user.upsert({
    where: { email: 'turkish@example.com' },
    update: {},
    create: {
      email: 'turkish@example.com',
      password: hashedPassword,
      name: 'Turkish Owner',
      emailVerified: true,
    },
  });

  const turkishRestaurant = await prisma.organization.upsert({
    where: { slug: 'istanbul-kebab' },
    update: {},
    create: {
      name: 'İstanbul Kebap',
      slug: 'istanbul-kebab',
      plan: Plan.FREE,
      status: OrgStatus.ACTIVE,
      aiCredits: 1000,
      aiCreditsUsed: 0,
    },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_orgId: {
        userId: turkishOwner.id,
        orgId: turkishRestaurant.id,
      },
    },
    update: {},
    create: {
      userId: turkishOwner.id,
      orgId: turkishRestaurant.id,
      role: Role.OWNER,
    },
  });

  const turkishMenu = await prisma.menu.create({
    data: {
      orgId: turkishRestaurant.id,
      name: 'Ana Menü',
      locale: 'tr',
      isActive: true,
    },
  });

  const kebabs = await prisma.category.create({
    data: {
      menuId: turkishMenu.id,
      name: 'Kebaplar',
      description: 'Geleneksel Türk kebapları',
      sortOrder: 0,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      { categoryId: kebabs.id, name: 'Adana Kebap', price: 85.00, isAvailable: true, sortOrder: 0 },
      { categoryId: kebabs.id, name: 'Urfa Kebap', price: 85.00, isAvailable: true, sortOrder: 1 },
      { categoryId: kebabs.id, name: 'İskender', price: 95.00, isAvailable: true, sortOrder: 2 },
    ],
  });

  console.log('✅ Turkish restaurant created');

  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log('✅ Users: 5');
  console.log('✅ Organizations: 3');
  console.log('✅ Menus: 2');
  console.log('✅ Menu items: 8');
  console.log('\n🔐 Login Credentials:');
  console.log('================');
  console.log('Admin: admin@qrestai.com / Password123!');
  console.log('Demo Restaurant: demo@restaurant.com / Password123!');
  console.log('Editor: editor@restaurant.com / Password123!');
  console.log('Turkish: turkish@example.com / Password123!');
  console.log('\n✅ Database seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
