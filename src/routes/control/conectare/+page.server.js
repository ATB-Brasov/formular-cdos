import { fail, redirect } from "@sveltejs/kit";
import { createAdminSession  } from "$lib/server/session.js";
import { dev } from "$app/environment";
import argon2 from "argon2";

/** @type {import('./$types').PageServerLoad} */
export async function load({ }) {
    return {  };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({request, cookies}) => {
        const data = await request.formData();
        const parola = data.get("parola");

        if (parola == null) {
            return fail(400, {msg: "Introdu parola!"})
        }

        const h = Deno.env.get("HASH_CONTROL")
        if (await argon2.verify(h, parola.toString())) {
            const sessionid = await createAdminSession()
            cookies.set("adminsession", sessionid, {
                path: "/",
                httpOnly: true,
                secure: !dev,
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 1 day
            });
            redirect(303, "/control")
        } else {
            return fail(400, {msg: "Parolă greșită"})
        }
    }
}
