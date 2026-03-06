// REFERENCE: This file is provided as an example for creating indexes.
// Students must add a similar index for the Book collection as required in the exam.
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function ensureIndexes() {
  const client = await getClientPromise();
  const db = client.db("library");

  const userCollection = db.collection("users");
  await userCollection.createIndex({ username: 1 }, { unique: true });
  await userCollection.createIndex({ email: 1 }, { unique: true });

  const bookCollection = db.collection("books");
  await bookCollection.createIndex({ title: 1 });
  await bookCollection.createIndex({ author: 1 });

  const adminEmail = "admin@test.com";
  if (!(await userCollection.findOne({ email: adminEmail }))) {
    await userCollection.insertOne({
      email: adminEmail,
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      status: "ACTIVE",
    });
  }

  const userEmail = "user@test.com";
  if (!(await userCollection.findOne({ email: userEmail }))) {
    await userCollection.insertOne({
      email: userEmail,
      username: "user",
      password: await bcrypt.hash("user123", 10),
      role: "USER",
      status: "ACTIVE",
    });
  }
}
