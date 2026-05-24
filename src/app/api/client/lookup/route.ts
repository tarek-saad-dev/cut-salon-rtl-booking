import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const mobile = req.nextUrl.searchParams.get("mobile")?.trim();

  if (!mobile) {
    return NextResponse.json(
      { ok: false, message: "mobile parameter is required" },
      { status: 400 },
    );
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Mobile", sql.NVarChar(50), mobile)
      .query<{
        ClientID: number;
        Name: string;
        Mobile: string;
        Phone: string | null;
        Address: string | null;
        Email: string | null;
      }>(
        `SELECT ClientID, Name, Mobile, Phone, Address, Email FROM dbo.TblClient
         WHERE REPLACE(REPLACE(REPLACE(Mobile, ' ', ''), '-', ''), '+2', '')
               LIKE '%' + @Mobile + '%'`,
      );

    if (result.recordset.length === 0) {
      return NextResponse.json({ ok: true, found: false, client: null });
    }

    const c = result.recordset[0];
    return NextResponse.json({
      ok: true,
      found: true,
      client: {
        id: c.ClientID,
        name: c.Name,
        mobile: c.Mobile,
        phone: c.Phone ?? "",
        address: c.Address ?? "",
        email: c.Email ?? "",
      },
    });
  } catch (err) {
    console.error("[client lookup] DB error:", err);
    return NextResponse.json(
      { ok: false, message: "Database error" },
      { status: 500 },
    );
  }
}
