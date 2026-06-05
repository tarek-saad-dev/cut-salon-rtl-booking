import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE || process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: { rewardId: string } }
) {
  let pool: sql.ConnectionPool | null = null;

  try {
    const { rewardId } = params;
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const body = await req.json().catch(() => ({}));
    const confirm = body?.confirm === true;

    console.log("[REDEEM] Request received:", {
      rewardId,
      clientId,
      confirm,
      timestamp: new Date().toISOString(),
    });

    // ─── CRITICAL VALIDATION: ClientID must exist ───────────────────────
    if (!clientId) {
      console.error("[REDEEM] ERROR: ClientID is missing");
      return NextResponse.json(
        {
          ok: false,
          error: "يرجى تسجيل الدخول أولاً",
          message: "User authentication required - ClientID is missing",
        },
        { status: 401 }
      );
    }

    if (!confirm) {
      return NextResponse.json(
        { ok: false, error: "يجب تأكيد الاستبدال" },
        { status: 400 }
      );
    }

    if (!rewardId) {
      return NextResponse.json(
        { ok: false, error: "معرف المكافأة مطلوب" },
        { status: 400 }
      );
    }

    pool = await sql.connect(config);

    // ─── 1. Verify client exists ────────────────────────────────────────
    const clientCheck = await pool
      .request()
      .input("clientId", sql.Int, parseInt(String(clientId)))
      .query(`
        SELECT ClientID, ClientName 
        FROM TblClient 
        WHERE ClientID = @clientId
      `);

    if (!clientCheck.recordset || clientCheck.recordset.length === 0) {
      console.error("[REDEEM] ERROR: Client not found:", clientId);
      return NextResponse.json(
        {
          ok: false,
          error: "لم يتم العثور على حسابك. يرجى تسجيل الدخول أولاً",
        },
        { status: 404 }
      );
    }

    const client = clientCheck.recordset[0];
    console.log("[REDEEM] Client verified:", {
      clientId: client.ClientID,
      clientName: client.ClientName,
    });

    // ─── 2. Get reward details ───────────────────────────────────────────
    const rewardResult = await pool
      .request()
      .input("rewardId", sql.Int, parseInt(rewardId))
      .query(`
        SELECT 
          RewardID,
          RewardNameEn,
          RewardNameAr,
          RequiredPoints,
          IsActive
        FROM TblLoyaltyReward
        WHERE RewardID = @rewardId AND IsActive = 1
      `);

    if (!rewardResult.recordset || rewardResult.recordset.length === 0) {
      console.error("[REDEEM] ERROR: Reward not found:", rewardId);
      return NextResponse.json(
        { ok: false, error: "المكافأة غير موجودة أو غير متاحة" },
        { status: 404 }
      );
    }

    const reward = rewardResult.recordset[0];
    const requiredPoints = reward.RequiredPoints;

    console.log("[REDEEM] Reward details:", {
      rewardId: reward.RewardID,
      rewardName: reward.RewardNameAr,
      requiredPoints,
    });

    // ─── 3. Get client's current points balance ─────────────────────────
    const balanceResult = await pool
      .request()
      .input("clientId", sql.Int, parseInt(String(clientId)))
      .query(`
        SELECT ISNULL(SUM(Points), 0) AS CurrentBalance
        FROM TblLoyaltyPointLedger
        WHERE ClientID = @clientId
      `);

    const currentBalance = balanceResult.recordset[0]?.CurrentBalance || 0;

    console.log("[REDEEM] Current balance:", {
      clientId,
      currentBalance,
      requiredPoints,
    });

    // ─── 4. Validate sufficient points ──────────────────────────────────
    if (currentBalance < requiredPoints) {
      console.warn("[REDEEM] Insufficient points:", {
        clientId,
        currentBalance,
        requiredPoints,
        shortage: requiredPoints - currentBalance,
      });
      return NextResponse.json(
        {
          ok: false,
          error: `رصيدك الحالي ${currentBalance} نقطة غير كافٍ. تحتاج ${requiredPoints} نقطة.`,
        },
        { status: 400 }
      );
    }

    // ─── 5. Generate unique redeem code ──────────────────────────────────
    const redeemCode = `CUT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log("[REDEEM] Generated redeem code:", redeemCode);

    // ─── 6. CRITICAL: Insert into TblLoyaltyPointLedger with validation ─
    console.log("[REDEEM] Attempting to insert ledger entry:", {
      clientId: parseInt(String(clientId)),
      points: -requiredPoints,
      rewardId: reward.RewardID,
      description: `Redeemed: ${reward.RewardNameAr}`,
    });

    // DOUBLE CHECK: ClientID must not be NULL
    const clientIdInt = parseInt(String(clientId));
    if (!clientIdInt || isNaN(clientIdInt)) {
      console.error("[REDEEM] CRITICAL ERROR: ClientID is invalid:", clientId);
      return NextResponse.json(
        {
          ok: false,
          error: "خطأ في معرف العميل. يرجى تسجيل الدخول مرة أخرى",
        },
        { status: 400 }
      );
    }

    const insertResult = await pool
      .request()
      .input("clientId", sql.Int, clientIdInt)
      .input("points", sql.Int, -requiredPoints)
      .input("rewardId", sql.Int, reward.RewardID)
      .input("description", sql.NVarChar(500), `Redeemed: ${reward.RewardNameAr}`)
      .input("redeemCode", sql.NVarChar(100), redeemCode)
      .query(`
        INSERT INTO TblLoyaltyPointLedger 
          (ClientID, Points, MovementType, Description, RewardID, RedeemCode, CreatedAt)
        VALUES 
          (@clientId, @points, 'REDEEM', @description, @rewardId, @redeemCode, GETDATE())
      `);

    console.log("[REDEEM] Ledger entry inserted successfully:", {
      rowsAffected: insertResult.rowsAffected,
    });

    // ─── 7. Calculate new balance ────────────────────────────────────────
    const newBalance = currentBalance - requiredPoints;

    console.log("[REDEEM] SUCCESS:", {
      clientId,
      rewardId,
      redeemCode,
      oldBalance: currentBalance,
      newBalance,
      pointsDeducted: requiredPoints,
    });

    return NextResponse.json({
      ok: true,
      message: "تم استبدال المكافأة بنجاح",
      redeemCode,
      newBalance,
      pointsDeducted: requiredPoints,
    });
  } catch (error: unknown) {
    console.error("[REDEEM] FATAL ERROR:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check if it's a SQL error related to NULL ClientID
    if (errorMessage.includes("Cannot insert the value NULL into column 'ClientID'")) {
      console.error("[REDEEM] SQL ERROR: ClientID was NULL during INSERT");
      return NextResponse.json(
        {
          ok: false,
          error: "خطأ في التحقق من الهوية. يرجى تسجيل الدخول مرة أخرى",
          message: "ClientID validation failed - NULL value detected",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "حدث خطأ أثناء استبدال المكافأة",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close().catch(console.error);
    }
  }
}
