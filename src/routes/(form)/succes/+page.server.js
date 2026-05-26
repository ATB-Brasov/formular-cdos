import { dev } from "$app/environment";

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, url }) {
    cookies.delete("sessionid", {
        path: "/",
        httpOnly: true,
        partitioned: !dev,
        secure: !dev,
        sameSite: dev ? "lax" : "none",
    });
    return {
        answerId: url.searchParams.get("answerId"),
        email: url.searchParams.get("email"),
    };
}
