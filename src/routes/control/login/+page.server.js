import { fail, redirect } from "@sveltejs/kit";
import { createAdminSession } from "$lib/server/db.js";
import { checkRateLimit } from "$lib/server/rate_limit.js";
import { dev } from "$app/environment";
import argon2 from "argon2";

/** @type {import('./$types').PageServerLoad} */
export async function load({}) {
    return {};
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request, cookies, getClientAddress }) => {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        if (origin != null && host != null) {
            try {
                const originHost = new URL(origin).hostname;
                const serverHost = host.split(":")[0];
                if (originHost !== serverHost) {
                    return fail(403, { msg: "Cerere invalidă" });
                }
            } catch {
                return fail(400, { msg: "Cerere invalidă" });
            }
        }

        const ip = getClientAddress();
        const { allow, retryAfter } = await checkRateLimit(ip);
        if (!allow) {
            return fail(429, {
                msg: `Prea multe încercări. Încearcă din nou peste ${retryAfter}.`,
            });
        }

        const data = await request.formData();
        const password = data.get("password");

        if (password == null) {
            return fail(400, { msg: "Introdu parola!" });
        }

        const h = Deno.env.get("HASH_CONTROL");
        if (h == null) {
            throw new Error("HASH_CONTROL environment variable is missing!");
        }
        if (await argon2.verify(h, password.toString())) {
            const sessionid = await createAdminSession();
            cookies.set("adminsession", sessionid, {
                path: "/",
                httpOnly: true,
                secure: !dev,
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 1 day
            });
            redirect(303, "/control");
        } else {
            return fail(400, { msg: "Parolă greșită" });
        }
    },
};
