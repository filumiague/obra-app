import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const GESTOR_ONLY_PATHS = ["/dashboard", "/planejamento", "/estoque", "/relatorios"];
const PUBLIC_PATHS = ["/login", "/"];

// Refreshes the Supabase auth session on every request and enforces the
// gestor/campo route split. Role comes from the JWT's app_metadata (set at
// user creation), so this never needs a DB round trip.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const role = user.app_metadata?.role;

    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL(role === "CAMPO" ? "/diario" : "/dashboard", request.url),
      );
    }

    if (role === "CAMPO" && GESTOR_ONLY_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/diario", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
