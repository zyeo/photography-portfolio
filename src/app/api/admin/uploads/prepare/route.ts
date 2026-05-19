import { NextResponse } from "next/server";
import { buildOriginalObjectPath, assertAcceptedImage } from "@/lib/photos/uploads";
import { createClient } from "@/lib/supabase/server";

type PrepareRequest = {
  filename?: string;
  contentType?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as PrepareRequest;
  if (!body.filename || !body.contentType) {
    return NextResponse.json({ error: "Filename and content type are required." }, { status: 400 });
  }

  try {
    assertAcceptedImage(new File(["placeholder"], body.filename, { type: body.contentType }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image." },
      { status: 400 },
    );
  }

  const path = buildOriginalObjectPath(new File(["placeholder"], body.filename, { type: body.contentType }));
  const { data, error } = await supabase.storage.from("originals").createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, token: data.token });
}
