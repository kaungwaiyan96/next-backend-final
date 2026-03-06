import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { authResponse } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function PATCH(req, { params }) {
  const auth = authResponse(req, ["ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("library");

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;

    const { id } = await params;
    const result = await db
      .collection("borrows")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Not Found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
