import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { authResponse } from "@/lib/auth";
import corsHeaders from "@/lib/cors";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req) {
  const auth = authResponse(req);
  if (auth.error) return auth.error;

  try {
    const client = await getClientPromise();
    const db = client.db("library");

    let query = {};
    if (auth.user.role !== "ADMIN") {
      query.userId = auth.user.id;
    }

    const borrows = await db.collection("borrows").find(query).toArray();
    return NextResponse.json(borrows, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function POST(req) {
  const auth = authResponse(req, ["USER"]);
  if (auth.error) return auth.error;

  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("library");

    const newBorrow = {
      userId: auth.user.id,
      bookId: data.bookId,
      createdAt: new Date().toISOString(),
      targetDate: data.targetDate,
      status: "INIT", // Initial state
    };

    const result = await db.collection("borrows").insertOne(newBorrow);
    return NextResponse.json(
      { id: result.insertedId },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
