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

export async function GET(req, { params }) {
  const auth = authResponse(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const client = await getClientPromise();
    const db = client.db("library");
    const book = await db
      .collection("books")
      .findOne({ _id: new ObjectId(id) });

    if (!book) {
      return NextResponse.json(
        { message: "Not Found" },
        { status: 404, headers: corsHeaders },
      );
    }

    if (book.status === "DELETED" && auth.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403, headers: corsHeaders },
      );
    }

    return NextResponse.json(book, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function PATCH(req, { params }) {
  const auth = authResponse(req, ["ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("library");

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) updateData.status = data.status;

    const { id } = await params;
    const result = await db
      .collection("books")
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

export async function DELETE(req, { params }) {
  const auth = authResponse(req, ["ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const client = await getClientPromise();
    const db = client.db("library");

    // Soft delete
    const { id } = await params;
    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: "DELETED" } });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Not Found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
