-- OTOTAMIRCI DATABASE SETUP FOR SUPABASE
-- Run this entire script in Supabase SQL Editor

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop existing tables (if any)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS shop_categories CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('customer', 'mechanic')) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shop_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category VARCHAR(50) CHECK (category IN ('Motor', 'Kaporta', 'Elektrik', 'Lastik', 'Bakım')) NOT NULL,
    UNIQUE(shop_id, category)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    car_model VARCHAR(255) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')) DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_appointments_shop ON appointments(shop_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Step 5: Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Insert seed data
-- Insert users (password = 'password123' for both)
-- bcrypt hash for 'password123' with salt rounds 10
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Ahmet Yılmaz', 'ahmet@example.com', '$2a$10$8K1p/a0dL3LsBU1nH2XM9uuMqVUg6XpD/7e5YZ9K7LQ3aWZNQz3Yu', 'customer', '0555 123 45 67'),
('Usta Mehmet', 'mehmet@sanayi.com', '$2a$10$8K1p/a0dL3LsBU1nH2XM9uuMqVUg6XpD/7e5YZ9K7LQ3aWZNQz3Yu', 'mechanic', '0555 987 65 43');

-- Get the mechanic user ID for shops (we'll use a variable)
DO $$
DECLARE
    mechanic_id UUID;
    shop1_id UUID;
    shop2_id UUID;
    shop3_id UUID;
    shop4_id UUID;
    shop5_id UUID;
    customer_id UUID;
BEGIN
    -- Get mechanic user ID
    SELECT id INTO mechanic_id FROM users WHERE role = 'mechanic' LIMIT 1;
    SELECT id INTO customer_id FROM users WHERE role = 'customer' LIMIT 1;

    -- Insert shops
    INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, rating, is_open)
    VALUES (mechanic_id, 'Yıldız Oto Tamir', 41.0122, 28.9764, 'Atatürk Sanayi Sitesi, No: 12', '0555 123 45 67', 'https://picsum.photos/400/300?random=3', 4.5, true)
    RETURNING id INTO shop1_id;

    INSERT INTO shop_categories (shop_id, category) VALUES
    (shop1_id, 'Motor'),
    (shop1_id, 'Bakım');

    INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, rating, is_open)
    VALUES (mechanic_id, 'Demir Kaporta & Boya', 41.0052, 28.9854, 'Fatih Oto Sanayi, Blok B', '0532 987 65 43', 'https://picsum.photos/400/300?random=4', 4.2, true)
    RETURNING id INTO shop2_id;

    INSERT INTO shop_categories (shop_id, category) VALUES
    (shop2_id, 'Kaporta');

    INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, rating, is_open)
    VALUES (mechanic_id, 'Gürbüz Elektrik', 40.9982, 28.9684, 'Maslak Oto Sanayi, 2. Kısım', '0212 444 55 66', 'https://picsum.photos/400/300?random=5', 4.7, false)
    RETURNING id INTO shop3_id;

    INSERT INTO shop_categories (shop_id, category) VALUES
    (shop3_id, 'Elektrik'),
    (shop3_id, 'Bakım');

    INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, rating, is_open)
    VALUES (mechanic_id, 'Hızlı Lastik', 41.0182, 28.9924, 'Beşiktaş Çarşı Yanı', '0500 111 22 33', 'https://picsum.photos/400/300?random=6', 4.3, true)
    RETURNING id INTO shop4_id;

    INSERT INTO shop_categories (shop_id, category) VALUES
    (shop4_id, 'Lastik');

    INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url, rating, is_open)
    VALUES (mechanic_id, 'Pro Performans Servis', 41.0012, 28.9614, 'Zeytinburnu Sanayi', '0544 222 33 44', 'https://picsum.photos/400/300?random=7', 4.8, true)
    RETURNING id INTO shop5_id;

    INSERT INTO shop_categories (shop_id, category) VALUES
    (shop5_id, 'Motor'),
    (shop5_id, 'Elektrik'),
    (shop5_id, 'Bakım');

    -- Insert a sample appointment
    INSERT INTO appointments (shop_id, user_id, car_model, appointment_date, service_type, status, note)
    VALUES (shop1_id, customer_id, 'Volkswagen Golf 2018', NOW() + INTERVAL '1 day' + TIME '10:00:00', 'Bakım', 'pending', 'Yağ değişimi ve filtreler');

END $$;

-- Step 8: Verify data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Shops', COUNT(*) FROM shops
UNION ALL
SELECT 'Shop Categories', COUNT(*) FROM shop_categories
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;

-- Done! Test credentials:
-- Customer: ahmet@example.com / password123
-- Mechanic: mehmet@sanayi.com / password123
