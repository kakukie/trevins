/**
 * Database Migration Script
 * This script helps migrate data from SQLite to PostgreSQL (Supabase)
 * 
 * Usage:
 *   bun run scripts/migrate-db.ts
 */

import { PrismaClient } from '@prisma/client';

const OLD_DB_PATH = './db/custom.db';

interface OldUserData {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

async function migrateDatabase() {
  console.log('🚀 Starting database migration...\n');

  // Check if old SQLite database exists
  const fs = await import('fs/promises');
  
  try {
    await fs.access(OLD_DB_PATH);
    console.log('✅ Found old SQLite database:', OLD_DB_PATH);
  } catch {
    console.log('❌ Old SQLite database not found. Skipping migration.');
    console.log('💡 If this is a fresh installation, you can run: bun run db:generate');
    return;
  }

  // Initialize Prisma clients
  const oldPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${OLD_DB_PATH}`,
      },
    },
  });

  const newPrisma = new PrismaClient();

  try {
    console.log('📊 Fetching data from SQLite...\n');

    // Fetch all users from old database
    const oldUsers = await oldPrisma.$queryRaw<OldUserData[]>`
      SELECT * FROM User
    `;

    console.log(`📦 Found ${oldUsers.length} users\n`);

    // Check if new database has users
    const existingUsers = await newPrisma.user.count();
    
    if (existingUsers > 0) {
      console.log('⚠️  Warning: New database already has users.');
      console.log('💡 Do you want to continue? (This may create duplicates)');
      console.log('💡 To reset new database, run: bun run db:reset\n');
      
      // For safety, we'll exit
      console.log('❌ Migration cancelled. Please reset database first if needed.');
      return;
    }

    console.log('🔄 Migrating users...\n');

    // Migrate users
    for (const user of oldUsers) {
      try {
        await newPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error);
      }
    }

    console.log('\n📊 Fetching vendors...\n');

    // Migrate vendors
    const oldVendors = await oldPrisma.vendor.findMany();
    console.log(`📦 Found ${oldVendors.length} vendors\n`);

    for (const vendor of oldVendors) {
      try {
    await newPrisma.vendor.create({
      data: {
        ...vendor,
      },
    });
        console.log(`✅ Migrated vendor: ${vendor.businessName}`);
      } catch (error) {
        console.error(`❌ Failed to migrate vendor ${vendor.businessName}:`, error);
      }
    }

    console.log('\n📊 Fetching events...\n');

    // Migrate events
    const oldEvents = await oldPrisma.event.findMany();
    console.log(`📦 Found ${oldEvents.length} events\n`);

    for (const event of oldEvents) {
      try {
        await newPrisma.event.create({
          data: {
            ...event,
          },
        });
        console.log(`✅ Migrated event: ${event.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate event ${event.name}:`, error);
      }
    }

    // Add more migration logic for other entities as needed...

    console.log('\n✅ Migration completed successfully!');
    console.log('💡 Don\'t forget to run: bun run db:seed\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });