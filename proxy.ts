import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/stats"];

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
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    supabaseResponse = NextResponse.next({ request });

                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );

                    Object.entries(headers).forEach(([key, value]) =>
                        supabaseResponse.headers.set(key, value)
                    );
                }
            }
        }
    );

    // Keep token validation immediately after client creation so refreshed
    // cookies remain synchronized between this request and the browser.
    const {
        data: { user }
    } = await supabase.auth.getUser();

    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith(`${route}/`)
    );

    if (!user && isProtectedRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ]
};
