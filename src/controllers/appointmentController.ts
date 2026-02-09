import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query: string;
    let params: any[];

    if (userRole === 'customer') {
      // Customer sees their own appointments
      query = `
        SELECT 
          a.*,
          s.name as shop_name,
          u.name as user_name
        FROM appointments a
        JOIN shops s ON a.shop_id = s.id
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = $1
        ORDER BY a.appointment_date DESC
      `;
      params = [userId];
    } else {
      // Mechanic sees appointments for their shops
      query = `
        SELECT 
          a.*,
          s.name as shop_name,
          u.name as user_name
        FROM appointments a
        JOIN shops s ON a.shop_id = s.id
        JOIN users u ON a.user_id = u.id
        WHERE s.owner_id = $1
        ORDER BY a.appointment_date DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT 
        a.*,
        s.name as shop_name,
        s.owner_id as shop_owner_id,
        u.name as user_name
       FROM appointments a
       JOIN shops s ON a.shop_id = s.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = result.rows[0];

    // Check if user has access to this appointment
    if (appointment.user_id !== userId && appointment.shop_owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { shop_id, car_model, appointment_date, service_type, note } = req.body;
    const user_id = req.user!.id;

    // Check if user is a customer
    if (req.user!.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create appointments'
      });
    }

    // Check if shop exists and is open
    const shopCheck = await pool.query(
      'SELECT is_open FROM shops WHERE id = $1',
      [shop_id]
    );

    if (shopCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (!shopCheck.rows[0].is_open) {
      return res.status(400).json({
        success: false,
        message: 'Shop is not accepting appointments at this time'
      });
    }

    // Create appointment
    const result = await pool.query(
      `INSERT INTO appointments (shop_id, user_id, car_model, appointment_date, service_type, note, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [shop_id, user_id, car_model, appointment_date, service_type, note]
    );

    // Fetch complete appointment data
    const completeAppointment = await pool.query(
      `SELECT 
        a.*,
        s.name as shop_name,
        u.name as user_name
       FROM appointments a
       JOIN shops s ON a.shop_id = s.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      data: completeAppointment.rows[0]
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if appointment exists and user has permission
    const appointmentCheck = await pool.query(
      `SELECT a.*, s.owner_id 
       FROM appointments a
       JOIN shops s ON a.shop_id = s.id
       WHERE a.id = $1`,
      [id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = appointmentCheck.rows[0];

    // Only shop owner can change status (except customer can cancel their own)
    if (appointment.owner_id !== userId && appointment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this appointment'
      });
    }

    // Update status
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // Fetch complete appointment data
    const completeAppointment = await pool.query(
      `SELECT 
        a.*,
        s.name as shop_name,
        u.name as user_name
       FROM appointments a
       JOIN shops s ON a.shop_id = s.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: completeAppointment.rows[0]
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if appointment exists and belongs to user
    const appointmentCheck = await pool.query(
      'SELECT user_id FROM appointments WHERE id = $1',
      [id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointmentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own appointments'
      });
    }

    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
