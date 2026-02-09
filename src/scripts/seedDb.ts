import pool from '../config/database';
import bcrypt from 'bcryptjs';

const MOCK_DATA = {
  users: [
    {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      password: 'password123',
      role: 'customer',
      phone: '0555 123 45 67'
    },
    {
      name: 'Usta Mehmet',
      email: 'mehmet@sanayi.com',
      password: 'password123',
      role: 'mechanic',
      phone: '0555 987 65 43'
    }
  ],
  shops: [
    {
      name: 'Yıldız Oto Tamir',
      latitude: 41.0122,
      longitude: 28.9764,
      address: 'Atatürk Sanayi Sitesi, No: 12',
      phone: '0555 123 45 67',
      image_url: 'https://picsum.photos/400/300?random=3',
      categories: ['Motor', 'Bakım']
    },
    {
      name: 'Demir Kaporta & Boya',
      latitude: 41.0052,
      longitude: 28.9854,
      address: 'Fatih Oto Sanayi, Blok B',
      phone: '0532 987 65 43',
      image_url: 'https://picsum.photos/400/300?random=4',
      categories: ['Kaporta']
    },
    {
      name: 'Gürbüz Elektrik',
      latitude: 40.9982,
      longitude: 28.9684,
      address: 'Maslak Oto Sanayi, 2. Kısım',
      phone: '0212 444 55 66',
      image_url: 'https://picsum.photos/400/300?random=5',
      categories: ['Elektrik', 'Bakım'],
      is_open: false
    },
    {
      name: 'Hızlı Lastik',
      latitude: 41.0182,
      longitude: 28.9924,
      address: 'Beşiktaş Çarşı Yanı',
      phone: '0500 111 22 33',
      image_url: 'https://picsum.photos/400/300?random=6',
      categories: ['Lastik']
    },
    {
      name: 'Pro Performans Servis',
      latitude: 41.0012,
      longitude: 28.9614,
      address: 'Zeytinburnu Sanayi',
      phone: '0544 222 33 44',
      image_url: 'https://picsum.photos/400/300?random=7',
      categories: ['Motor', 'Elektrik', 'Bakım']
    }
  ]
};

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    
    await client.query('BEGIN');

    // Insert users
    const userIds: Record<string, string> = {};
    for (const user of MOCK_DATA.users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [user.name, user.email, hashedPassword, user.role, user.phone]
      );
      userIds[user.role] = result.rows[0].id;
      console.log(`  ✓ User created: ${user.email}`);
    }

    // Insert shops
    const shopIds: string[] = [];
    for (const shop of MOCK_DATA.shops) {
      const result = await client.query(
        `INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, is_open, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userIds.mechanic,
          shop.name,
          shop.latitude,
          shop.longitude,
          shop.address,
          shop.phone,
          shop.image_url,
          shop.is_open !== false,
          (Math.random() * 1.5 + 3.5).toFixed(1) // Random rating between 3.5-5.0
        ]
      );
      const shopId = result.rows[0].id;
      shopIds.push(shopId);

      // Insert categories for this shop
      for (const category of shop.categories) {
        await client.query(
          `INSERT INTO shop_categories (shop_id, category) VALUES ($1, $2)`,
          [shopId, category]
        );
      }
      
      console.log(`  ✓ Shop created: ${shop.name}`);
    }

    // Insert sample appointments
    if (shopIds.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await client.query(
        `INSERT INTO appointments (shop_id, user_id, car_model, appointment_date, service_type, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          shopIds[0],
          userIds.customer,
          'Volkswagen Golf 2018',
          tomorrow,
          'Bakım',
          'pending',
          'Yağ değişimi ve filtreler'
        ]
      );
      console.log('  ✓ Sample appointment created');
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
    
    console.log('\n📋 Test Credentials:');
    console.log('Customer: ahmet@example.com / password123');
    console.log('Mechanic: mehmet@sanayi.com / password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
