import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNearbyShops = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = 10, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Haversine formula to calculate distance and find nearby shops
    let query = `
      SELECT 
        s.id, s.name, s.latitude, s.longitude, s.address, 
        s.phone, s.image_url, s.rating, s.is_open,
        array_agg(DISTINCT sc.category) FILTER (WHERE sc.category IS NOT NULL) as categories,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(s.latitude))
          )
        ) AS distance
      FROM shops s
      LEFT JOIN shop_categories sc ON s.id = sc.shop_id
      GROUP BY s.id
      HAVING (
        6371 * acos(
          cos(radians($1)) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(s.latitude))
        )
      ) < $3
    `;

    const params: any[] = [parseFloat(lat as string), parseFloat(lng as string), parseFloat(radius as string)];

    // Add category filter if provided
    if (category) {
      query += ` AND $4 = ANY(array_agg(sc.category))`;
      params.push(category);
    }

    query += ` ORDER BY distance`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get nearby shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getShopById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        s.*,
        array_agg(sc.category) FILTER (WHERE sc.category IS NOT NULL) as categories
       FROM shops s
       LEFT JOIN shop_categories sc ON s.id = sc.shop_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get shop by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const createShop = async (req: AuthRequest, res: Response) => {
  try {
    const { name, latitude, longitude, address, phone, image_url, categories } = req.body;
    const owner_id = req.user!.id;

    // Check if user is a mechanic
    if (req.user!.role !== 'mechanic') {
      return res.status(403).json({
        success: false,
        message: 'Only mechanics can create shops'
      });
    }

    // Insert shop
    const shopResult = await pool.query(
      `INSERT INTO shops (owner_id, name, latitude, longitude, address, phone, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [owner_id, name, latitude, longitude, address, phone, image_url]
    );

    const shop = shopResult.rows[0];

    // Insert categories
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        await pool.query(
          'INSERT INTO shop_categories (shop_id, category) VALUES ($1, $2)',
          [shop.id, category]
        );
      }
    }

    // Fetch complete shop data with categories
    const completeShop = await pool.query(
      `SELECT 
        s.*,
        array_agg(sc.category) FILTER (WHERE sc.category IS NOT NULL) as categories
       FROM shops s
       LEFT JOIN shop_categories sc ON s.id = sc.shop_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [shop.id]
    );

    res.status(201).json({
      success: true,
      data: completeShop.rows[0]
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, image_url, categories } = req.body;

    // Check if shop belongs to user
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM shops WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (ownerCheck.rows[0].owner_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop'
      });
    }

    // Update shop
    await pool.query(
      `UPDATE shops 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           image_url = COALESCE($4, image_url)
       WHERE id = $5`,
      [name, address, phone, image_url, id]
    );

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      await pool.query('DELETE FROM shop_categories WHERE shop_id = $1', [id]);
      for (const category of categories) {
        await pool.query(
          'INSERT INTO shop_categories (shop_id, category) VALUES ($1, $2)',
          [id, category]
        );
      }
    }

    // Fetch updated shop
    const result = await pool.query(
      `SELECT 
        s.*,
        array_agg(sc.category) FILTER (WHERE sc.category IS NOT NULL) as categories
       FROM shops s
       LEFT JOIN shop_categories sc ON s.id = sc.shop_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_open } = req.body;

    // Check if shop belongs to user
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM shops WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (ownerCheck.rows[0].owner_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own shop'
      });
    }

    const result = await pool.query(
      'UPDATE shops SET is_open = $1 WHERE id = $2 RETURNING *',
      [is_open, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const deleteShop = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if shop belongs to user
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM shops WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (ownerCheck.rows[0].owner_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own shop'
      });
    }

    await pool.query('DELETE FROM shops WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
