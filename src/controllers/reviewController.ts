import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get reviews for a shop
export const getShopReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.shop_id = $1
       ORDER BY r.created_at DESC`,
      [shopId]
    );

    // Calculate average rating
    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count
       FROM reviews WHERE shop_id = $1`,
      [shopId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        average_rating: parseFloat(avgResult.rows[0].avg_rating).toFixed(1),
        review_count: parseInt(avgResult.rows[0].review_count)
      }
    });
  } catch (error) {
    console.error('Get shop reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create or update a review
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.id;

    // Only customers can leave reviews
    if (req.user!.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can leave reviews'
      });
    }

    // Upsert review (insert or update on conflict)
    const result = await pool.query(
      `INSERT INTO reviews (shop_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (shop_id, user_id)
       DO UPDATE SET rating = $3, comment = $4, updated_at = NOW()
       RETURNING *`,
      [shopId, userId, rating, comment]
    );

    // Update shop's average rating
    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE shop_id = $1`,
      [shopId]
    );

    await pool.query(
      `UPDATE shops SET rating = $1 WHERE id = $2`,
      [parseFloat(avgResult.rows[0].avg_rating).toFixed(2), shopId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
