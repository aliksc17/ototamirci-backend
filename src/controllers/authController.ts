import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      phone_visible = true,
      // Mechanic-specific fields
      shop_name,
      address,
      latitude,
      longitude,
      categories,
      working_hours
    } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, phone_visible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, avatar_url, phone, phone_visible, created_at`,
      [name, email, hashedPassword, role, phone, phone_visible]
    );

    const user = result.rows[0];

    // If mechanic, create shop
    if (role === 'mechanic' && shop_name && address && latitude && longitude) {
      const shopResult = await pool.query(
        `INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, working_hours, rating, is_open)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0.0, true)
         RETURNING id`,
        [user.id, shop_name, latitude, longitude, address, phone, working_hours ? JSON.stringify(working_hours) : null]
      );

      const shopId = shopResult.rows[0].id;

      // Add shop categories
      if (categories && Array.isArray(categories)) {
        // Map frontend category IDs to database values
        const categoryMap: Record<string, string> = {
          'motor': 'Motor',
          'kaporta': 'Kaporta',
          'elektrik': 'Elektrik',
          'lastik': 'Lastik',
          'bakim': 'Bakım'
        };
        
        for (const category of categories) {
          const dbCategory = categoryMap[category.toLowerCase()] || category;
          await pool.query(
            'INSERT INTO shop_categories (shop_id, category) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [shopId, dbCategory]
          );
        }
      }
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          phone: user.phone,
          phone_visible: user.phone_visible
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar_url, phone FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar_url } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, name, email, role, avatar_url, phone`,
      [name, phone, avatar_url, req.user!.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
