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
  const auth = authResponse(req); // Any authenticated user
  if (auth.error) return auth.error;

  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("library");

    const { id } = await params;

    // Find borrow request
    const borrow = await db
      .collection("borrows")
      .findOne({ _id: new ObjectId(id) });

    if (!borrow) {
      return NextResponse.json(
        { message: "Not Found" },
        { status: 404, headers: corsHeaders },
      );
    }

    const newStatus = data.status;
    let isAllowed = false;

    if (auth.user.role === "ADMIN") {
      if (
        [
          "INIT",
          "CLOSE-NO-AVAILABLE-BOOK",
          "ACCEPTED",
          "CANCEL-ADMIN",
        ].includes(newStatus)
      ) {
        isAllowed = true;
      }
    } else if (auth.user.role === "USER" && auth.user.id === borrow.userId) {
      // User can only cancel their request
      if (newStatus === "CANCEL-USER" && borrow.status === "INIT") {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Forbidden or Invalid Transition" },
        { status: 403, headers: corsHeaders },
      );
    }

    const result = await db
      .collection("borrows")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: newStatus } });

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
