import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";
import { env } from "@/lib/env";
import { guestCreationAllowed } from "@/lib/guest-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!(await guestCreationAllowed())) {
    return NextResponse.json(
      { error: "Too many new sessions from this address. Try again later." },
      { status: 429 }
    );
  }

  return signIn("guest", { redirect: true, redirectTo: redirectUrl });
}
