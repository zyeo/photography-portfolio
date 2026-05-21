import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Direct file-body uploads are no longer supported. Use the admin upload UI so files upload directly to storage." },
    { status: 410 },
  );
}
