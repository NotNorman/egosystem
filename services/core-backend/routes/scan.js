const express = require('express');
const router = express.Router();
// Assuming you are using the 'pg' library for PostgreSQL
const pool = require('../db'); 

// --- SCAN & TAP-IN ROUTE ---
router.post('/api/scan', async (req, res) => {
  const { nfc_uid, device_id } = req.body;

  if (!nfc_uid) {
    return res.status(400).json({ authorized: false, reason: "Missing UID" });
  }

  // Get a dedicated client from the pool to run a Transaction
  const client = await pool.connect();

  try {
    // Start a SQL transaction (ensures both checking and logging happen together safely)
    await client.query('BEGIN');

    // 1. Fetch the user, card status, and their latest subscription (if they have one)
    const checkQuery = `
      SELECT 
        u.username, 
        c.is_active,
        s.status, 
        s.current_period_end
      FROM card_data c
      JOIN user_data u ON c.user_id = u.id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE c.nfc_uid = $1
      ORDER BY s.current_period_end DESC NULLS LAST
      LIMIT 1;
    `;
    const userResult = await client.query(checkQuery, [nfc_uid]);

    let access_granted = false;
    let denied_reason = null;
    let responseName = "";

    // 2. Determine the exact outcome
    if (userResult.rows.length === 0) {
      denied_reason = "Unregistered Card";
    } else {
      const row = userResult.rows[0];
      
      // We know who the user is, even if they are about to be denied
      responseName = row.username; 

      // Check conditions in order of priority
      if (!row.is_active) {
        denied_reason = "Card Disabled";
      } else if (!row.status) {
        denied_reason = "No Subscription";
      } else if (row.status !== 'active') {
        denied_reason = "Inactive Subscription";
      } else if (new Date(row.current_period_end) < new Date()) {
        denied_reason = "Expired Subscription";
      } else {
        // If it passes all checks, let them in!
        access_granted = true;
      }
    }

    // 3. Log the attempt into your tap_logs table (ALWAYS happens for both success and denied)
    const logQuery = `
      INSERT INTO tap_logs (nfc_uid, device_id, access_granted, denied_reason)
      VALUES ($1, $2, $3, $4)
    `;
    // If ESP32 didn't send a device_id, default to 'No Device ID Provided'
    await client.query(logQuery, [nfc_uid, device_id || 'No Device ID Provided', access_granted, denied_reason]);

    // 4. If access is granted, ALSO start an active exercise session
    if (access_granted) {
      // First, forcefully close any "stuck" active sessions for this specific user
      const cleanupQuery = `
        UPDATE exercise_data 
        SET end_time = CURRENT_TIMESTAMP, status = 'forced_closed' 
        WHERE nfc_uid = $1 AND status = 'active'
      `;
      await client.query(cleanupQuery, [nfc_uid]);

      // Second, determine the exercise type based on the ESP32's device_id
      let exerciseType = 'general'; // A safe fallback
      if (device_id === 'Ego Fitness Check-in') {
        exerciseType = 'fitness';
      } else if (device_id === 'Rowing Machine') {
        exerciseType = 'rowing';
      }

      // Third, start the brand new session with the correct type
      const startSessionQuery = `
        INSERT INTO exercise_data (nfc_uid, exercise_type, status)
        VALUES ($1, $2, 'active')
      `;
      await client.query(startSessionQuery, [nfc_uid, exerciseType]);
    }

    // 5. Get the count BEFORE committing (Safely inside the transaction sandbox)
    let activeCount = 0;
    if (access_granted) {
      const countQuery = `SELECT COUNT(*) FROM exercise_data WHERE status = 'active'`;
      const countResult = await client.query(countQuery);
      activeCount = parseInt(countResult.rows[0].count, 10);
    }

    // 6. Commit the transaction to save ALL logs and the session permanently
    await client.query('COMMIT');

    // 7. Send the final verdict back to the ESP32 (Only happens if DB safely commits)
    if (access_granted) {
      res.json({ authorized: true, name: responseName, active_count: activeCount });
    } else {
      res.json({ authorized: false, reason: denied_reason });
    }

  } catch (error) {
    // If anything fails, rollback the transaction so we don't get partial data
    await client.query('ROLLBACK');
    res.status(500).json({ authorized: false, reason: "Server Error" });
  } finally {
    client.release();
  }
});

// --- AUTO-CHECKOUT ROUTE ---
router.post('/api/checkout', async (req, res) => {
  const { action } = req.body;

  if (action !== 'checkout_all') {
    return res.status(400).json({ status: "error", reason: "Invalid action" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find any open workouts and close them by stamping the current time
    const checkoutQuery = `
      UPDATE exercise_data 
      SET end_time = CURRENT_TIMESTAMP, status = 'completed' 
      WHERE status = 'active'
    `;
    
    // Execute and capture the result to know exactly how many sessions were closed
    const result = await client.query(checkoutQuery);

    await client.query('COMMIT');
    
    res.json({ status: "success", message: `Closed ${result.rowCount} sessions.` });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ status: "error", reason: "Server Error" });
  } finally {
    client.release();
  }
});

module.exports = router;