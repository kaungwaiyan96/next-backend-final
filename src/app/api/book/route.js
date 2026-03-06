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

  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const author = searchParams.get("author");

  let query = {};
  if (auth.user.role !== "ADMIN") {
    query.status = { $ne: "DELETED" };
  }
  if (title) {
    query.title = { $regex: title, $options: "i" };
  }
  if (author) {
    query.author = { $regex: author, $options: "i" };
  }

  try {
    const client = await getClientPromise();
    const db = client.db("library");
    const books = await db.collection("books").find(query).toArray();
    return NextResponse.json(books, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function POST(req) {
  const auth = authResponse(req, ["ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("library");

    const newBook = {
      title: data.title,
      author: data.author,
      quantity: data.quantity || 1,
      location: data.location || "",
      status: "AVAILABLE", // not DELETED
    };

    const result = await db.collection("books").insertOne(newBook);
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
