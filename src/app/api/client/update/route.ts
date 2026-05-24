import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      clientId: number;
      name?: string;
      phone?: string;
      mobile?: string;
      address?: string;
      email?: string;
    };

    if (!body.clientId) {
      return NextResponse.json({ ok: false, message: "clientId is required" }, { status: 400 });
    }

    const pool = await getPool();
    const request = pool.request().input("ClientID", sql.Int, body.clientId);

    const sets: string[] = [];
    if (body.name !== undefined) { request.input("Name", sql.NVarChar(200), body.name); sets.push("Name = @Name"); }
    if (body.phone !== undefined) { request.input("Phone", sql.NVarChar(50), body.phone); sets.push("Phone = @Phone"); }
    if (body.mobile !== undefined) { request.input("Mobile", sql.NVarChar(50), body.mobile); sets.push("Mobile = @Mobile"); }
    if (body.address !== undefined) { request.input("Address", sql.NVarChar(500), body.address); sets.push("Address = @Address"); }
    if (body.email !== undefined) { request.input("Email", sql.NVarChar(200), body.email); sets.push("Email = @Email"); }

    if (sets.length === 0) {
      return NextResponse.json({ ok: false, message: "No fields to update" }, { status: 400 });
    }

    await request.query(`UPDATE dbo.TblClient SET ${sets.join(", ")} WHERE ClientID = @ClientID`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[client update] DB error:", err);
    return NextResponse.json({ ok: false, message: "Database error" }, { status: 500 });
  }
}
