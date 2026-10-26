// app/api/scan/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // In Next.js, you parse the body asynchronously using req.json()
    const body = await req.json();
    const { nfc_uid, device_id } = body;

    if (!nfc_uid) {
      return NextResponse.json(
        { authorized: false, reason: "Missing UID" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const checkQuery = `
        SELECT 
          u.username, 
          c.is_active,
          s.status, 
          s.current_period_end
        FROM card_data c
        JOIN user_data u ON c.user_id = u.id
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.product_id = 1
        WHERE c.nfc_uid = $1
        ORDER BY s.current_period_end DESC NULLS LAST
        LIMIT 1;
      `;
      const userResult = await client.query(checkQuery, [nfc_uid]);

      let access_granted = false;
      let denied_reason = null;
      let responseName = "";

      if (userResult.rows.length === 0) {
        denied_reason = "Unregistered Card";
      } else {
        const row = userResult.rows[0];
        responseName = row.username;

        if (!row.is_active) {
          denied_reason = "Card Disabled";
        } else if (!row.status) {
          denied_reason = "No Subscription";
        } else if (row.status !== "active") {
          denied_reason = "Inactive Subscription";
        } else if (new Date(row.current_period_end) < new Date()) {
          denied_reason = "Expired Subscription";
        } else {
          access_granted = true;
        }
      }

      const logQuery = `
        INSERT INTO tap_logs (nfc_uid, device_id, access_granted, denied_reason)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(logQuery, [
        nfc_uid,
        device_id || "No Device ID Provided",
        access_granted,
        denied_reason,
      ]);

      if (access_granted) {
        const cleanupQuery = `
          UPDATE exercise_data 
          SET end_time = CURRENT_TIMESTAMP, status = 'forced_closed' 
          WHERE nfc_uid = $1 AND status = 'active'
        `;
        await client.query(cleanupQuery, [nfc_uid]);

        let exerciseType = "general";
        if (device_id === "Ego Fitness Check-in") {
          exerciseType = "fitness";
        } else if (device_id === "Rowing Machine") {
          exerciseType = "rowing";
        }

        const startSessionQuery = `
          INSERT INTO exercise_data (nfc_uid, exercise_type, status)
          VALUES ($1, $2, 'active')
        `;
        await client.query(startSessionQuery, [nfc_uid, exerciseType]);
      }

      let activeCount = 0;
      if (access_granted) {
        const countQuery = `SELECT COUNT(*) FROM exercise_data WHERE status = 'active'`;
        const countResult = await client.query(countQuery);
        activeCount = parseInt(countResult.rows[0].count, 10);
      }

      await client.query("COMMIT");

      if (access_granted) {
        return NextResponse.json({
          authorized: true,
          name: responseName,
          active_count: activeCount,
        });
      } else {
        return NextResponse.json({
          authorized: false,
          reason: denied_reason,
        });
      }
    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Database Transaction Error:", dbError);
      return NextResponse.json(
        { authorized: false, reason: "Server Error" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Request Parsing Error:", error);
    return NextResponse.json(
      { authorized: false, reason: "Bad Request" },
      { status: 400 }
    );
  }
}