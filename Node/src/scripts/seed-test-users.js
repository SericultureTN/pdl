import bcrypt from 'bcrypt';
import { query } from '../postgres.js';

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    // 1. Check/Create Super Admin
    console.log('Checking Super Admin...');
    const adminResult = await query(
      'SELECT * FROM admins WHERE email = $1',
      ['admin@example.com']
    );

    if (adminResult.rows.length === 0) {
      console.log('Creating Super Admin...');
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      await query(
        'INSERT INTO admins (email, password_hash, role, name) VALUES ($1, $2, $3, $4)',
        ['admin@example.com', passwordHash, 'super_admin', 'Super Administrator']
      );
      console.log('✅ Super Admin created: admin@example.com / Admin123!');
    } else {
      console.log('✅ Super Admin already exists');
    }

    // 2. Check/Create Section Admin
    console.log('\nChecking Section Admin...');
    const sectionAdminResult = await query(
      'SELECT * FROM sericulturists WHERE email = $1',
      ['sectionadmin@example.com']
    );

    if (sectionAdminResult.rows.length === 0) {
      console.log('Creating Section Admin...');
      await query(
        `INSERT INTO sericulturists (name, email, password, phone, address, role, ad_office, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['Section Admin', 'sectionadmin@example.com', 'password123', '9876543210', 'Hosur Office', 'section_admin', 'Hosur', 'active']
      );
      console.log('✅ Section Admin created: sectionadmin@example.com / password123');
    } else {
      console.log('✅ Section Admin already exists');
    }

    // 3. Check/Create AD Office User
    console.log('\nChecking AD Office User...');
    const userResult = await query(
      'SELECT * FROM sericulturists WHERE email = $1',
      ['user@example.com']
    );

    if (userResult.rows.length === 0) {
      console.log('Creating AD Office User...');
      await query(
        `INSERT INTO sericulturists (name, email, password, phone, address, role, ad_office, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['AD Office User', 'user@example.com', 'password123', '9876543211', 'Hosur Office', 'user', 'Hosur', 'active']
      );
      console.log('✅ AD Office User created: user@example.com / password123');
    } else {
      console.log('✅ AD Office User already exists');
    }

    console.log('\n📋 Test Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Role           │ Email                      │ Password');
    console.log('━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━');
    console.log('Super Admin    │ admin@example.com          │ Admin123!');
    console.log('Section Admin  │ sectionadmin@example.com   │ password123');
    console.log('AD Office User │ user@example.com           │ password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedTestUsers();
