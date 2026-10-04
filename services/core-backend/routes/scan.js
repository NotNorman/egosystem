const express = require('express');
const router = express.Router();
// Assuming you are using the 'pg' library for PostgreSQL
const pool = require('../db'); 

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

    // 3. Log the attempt into your tap_logs table
    const logQuery = `
      INSERT INTO tap_logs (nfc_uid, device_id, access_granted, denied_reason)
      VALUES ($1, $2, $3, $4)
    `;
    // If ESP32 didn't send a device_id, default to 'MAIN_DOOR'
    await client.query(logQuery, [nfc_uid, device_id || 'Ego Fitness Check-in', access_granted, denied_reason]);

    // Commit the transaction to save the log
    await client.query('COMMIT');

    // 4. Send the final verdict back to the ESP32
    if (access_granted) {
      res.json({ authorized: true, name: responseName });
    } else {
      res.json({ authorized: false, reason: denied_reason });
    }

  } catch (error) {
    // If anything fails, rollback the transaction so we don't get partial data
    await client.query('ROLLBACK');
    console.error("NFC Scan Error:", error);
    res.status(500).json({ authorized: false, reason: "Server Error" });
  } finally {
    client.release();
  }
});

module.exports = router;