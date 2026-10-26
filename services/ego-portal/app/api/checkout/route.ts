// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action !== "checkout_all") {
      return NextResponse.json(
        { status: "error", reason: "Invalid action" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const checkoutQuery = `
        UPDATE exercise_data 
        SET end_time = CURRENT_TIMESTAMP, status = 'completed' 
        WHERE status = 'active'
      `;
      
      const result = await client.query(checkoutQuery);

      await client.query("COMMIT");
      
      return NextResponse.json({
        status: "success",
        message: `Closed ${result.rowCount} sessions.`,
      });

    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Checkout Transaction Error:", dbError);
      return NextResponse.json(
        { status: "error", reason: "Server Error" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Request Parsing Error:", error);
    return NextResponse.json(
      { status: "error", reason: "Bad Request" },
      { status: 400 }
    );
  }
}