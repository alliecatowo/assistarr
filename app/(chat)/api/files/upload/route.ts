import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { isDemoMode } from "@/lib/demo/mode";
import { RateLimiter } from "@/lib/rate-limit";
import { safeUploadName, sniffImageType } from "@/lib/upload-validation";

// Per-user upload quota: public blobs cost storage, so cap the rate.
const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: Number(process.env.UPLOADS_PER_HOUR_PER_USER ?? 20),
});

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Uploads are disabled in the public demo" },
      { status: 403 }
    );
  }

  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.type === "guest") {
    return NextResponse.json(
      { error: "Sign in to upload files" },
      { status: 403 }
    );
  }

  const quota = await uploadLimiter.check(`upload:${session.user.id}`);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Upload limit reached. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(quota.resetIn / 1000)) },
      }
    );
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();

    // The client-declared MIME type is untrusted: check the magic bytes.
    const detectedType = sniffImageType(new Uint8Array(fileBuffer));
    if (!detectedType) {
      return NextResponse.json(
        { error: "File content is not a valid JPEG or PNG image" },
        { status: 400 }
      );
    }

    // Blob has no name property; take it from the File and sanitize it.
    const filename = safeUploadName(
      (formData.get("file") as File).name,
      detectedType
    );

    try {
      const data = await put(filename, fileBuffer, {
        access: "public",
        contentType: detectedType,
        addRandomSuffix: true,
      });

      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
