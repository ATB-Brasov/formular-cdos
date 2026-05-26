import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { verifyPoW } from "$lib/server/pow.js";

import survey from "@content/cestionare/atb-cdos-2026.js";
import {
    createSession,
    deleteSession,
    getAnsweredEmail,
    getPreviousAnswers,
    getSession,
    overwriteAnswers,
    saveAnswers,
    updateSessionEmail,
} from "$lib/server/db.js";

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {Promise<string>}
 */
async function createSessionCookie(cookies) {
    const sessionid = await createSession(survey.id);
    cookies.set("sessionid", sessionid, {
        path: "/",
        httpOnly: true,
        partitioned: !dev,
        secure: !dev,
        sameSite: dev ? "lax" : "none",
        maxAge: 60 * 60, // 1 hour
    });
    return sessionid;
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, url }) {
    const editAnswerId = url.searchParams.get("edit");
    if (editAnswerId) {
        const prev = await getPreviousAnswers(survey.id, editAnswerId);
        return {
            editData: prev
                ? {
                    answerId: editAnswerId,
                    answers: Object.fromEntries(prev.answers),
                }
                : null,
        };
    }

    let sessionid = cookies.get("sessionid");
    if (sessionid == null) {
        sessionid = await createSessionCookie(cookies);
    }
    let session = await getSession(sessionid);
    return { session };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    posta: async ({ request, cookies }) => {
        const data = await request.formData();
        let nonce = data.get("nonce");
        let email = data.get("posta");
        if (email == null) {
            return fail(400, {
                errors: {
                    posta: {
                        type: "email-required",
                        msg: "Câmpul este obligatoriu",
                        pag: -1,
                    },
                },
            });
        }
        email = email.toString();

        const validationMsg = (survey.validare_posta != null)
            ? survey.validare_posta(email)
            : null;
        if (validationMsg != null) {
            return fail(400, {
                errors: {
                    posta: {
                        type: "email-invalid",
                        msg: validationMsg,
                        pag: -1,
                    },
                },
            });
        }

        if (nonce == null) {
            return fail(400, {
                errors: {
                    posta: {
                        type: "pow-required",
                        msg: "Nonce este null!",
                        pag: -1,
                    },
                },
            });
        }
        nonce = nonce.toString();
        if (!verifyPoW(email, nonce, 4)) {
            return fail(400, {
                errors: {
                    posta: {
                        type: "pow-invalid",
                        msg: "Verifică adresa poștei electronice și mai încearcă o dată",
                        pag: -1,
                    },
                },
            });
        }

        const answered_email = await getAnsweredEmail(survey.id, email);
        if (answered_email != null) {
            return fail(400, {
                errors: {
                    posta: {
                        type: "email-exists",
                        msg: "Este înregistrat răspuns pe această poștă electronică",
                        pag: -1,
                    },
                },
            });
        }

        const sessionid = cookies.get("sessionid");
        if (sessionid == null) {
            await createSessionCookie(cookies);
        } else {
            await updateSessionEmail(sessionid, email);
        }
        return { success: true };
    },

    submit: async ({ request, cookies }) => {
        const data = await request.formData();
        const dataDict = Object.fromEntries(
            data.entries().map(([name, value]) => [name, value.toString()]),
        );

        const isEdit = dataDict.edit === "true" && dataDict.answerId != null;

        /** @type {string|undefined} */
        let answerId;
        /** @type {string|undefined} */
        let email;

        if (isEdit) {
            answerId = dataDict.answerId;
            const prev = await getPreviousAnswers(survey.id, answerId);
            if (prev == null) {
                return fail(400, {
                    errors: {
                        _form: {
                            type: "edit-invalid",
                            msg: "Răspunsul nu a fost găsit.",
                            pag: -1,
                        },
                    },
                });
            }
        } else {
            const sessionId = cookies.get("sessionid");
            if (sessionId == null) {
                return fail(400, {
                    errors: {
                        _form: {
                            type: "session-required",
                            msg: "Nici o sesiune nu a fost setată",
                            pag: -1,
                        },
                    },
                });
            }
            let session = await getSession(sessionId);
            if (session == null) {
                return fail(400, {
                    errors: {
                        _form: {
                            type: "session-invalid",
                            msg: "Sesiune nevalidă",
                            pag: -1,
                        },
                    },
                });
            }

            if (session.email == null) {
                if (dataDict.posta == null) {
                    return fail(400, {
                        errors: {
                            _form: {
                                type: "email-required",
                                msg: "Poșta electronică a sesiunii nu a fost setată",
                                pag: -1,
                            },
                        },
                    });
                }
                session = await updateSessionEmail(sessionId, dataDict.posta);
                if (session == null || session.email == null) {
                    return fail(400, {
                        errors: {
                            _form: {
                                type: "session-invalid",
                                msg: "Sesiune nevalidă",
                                pag: -1,
                            },
                        },
                    });
                }
            }
            email = /** @type {string} */ (session.email);
            answerId = session.answerId;

            const validationMsg = (survey.validare_posta != null)
                ? survey.validare_posta(session.email)
                : null;
            if (validationMsg != null) {
                return fail(400, {
                    errors: {
                        posta: {
                            type: "email-invalid",
                            msg: validationMsg,
                            pag: 0,
                        },
                    },
                });
            }

            const nonce = dataDict.nonce;
            if (nonce == null || !verifyPoW(session.email, nonce, 4)) {
                return fail(400, {
                    errors: {
                        _form: {
                            type: "pow-invalid",
                            msg: "Verifică adresa poștei electronice și mai încearcă o dată",
                            pag: -1,
                        },
                    },
                });
            }
        }

        let activeSurvey = survey;

        if (dataDict.test === "true") {
            activeSurvey =
                (await import("@content/cestionare/atb-cdos-2026_test.js"))
                    .default;
        }

        /** @type { {[name: string]: import("$lib/common_types.js").FieldError} } */
        const errors = {};

        /** @type {[string, string][]} */
        const answers = [];

        const sections = activeSurvey.pagini;
        let minErrorSection = sections.length;
        for (let sectionIdx = 0; sectionIdx < sections.length; ++sectionIdx) {
            const section = sections[sectionIdx];
            if (section.ascunde?.(dataDict)) {
                continue;
            }
            for (let field of section.cimpuri) {
                const formFieldValue = data.get(field.nume);

                if (!formFieldValue) {
                    if (!field.ascunde?.(dataDict) && field.obligatoriu) {
                        errors[field.nume] = {
                            type: "field-required",
                            msg: "Câmpul este obligatoriu",
                            pag: sectionIdx,
                        };
                        minErrorSection = Math.min(minErrorSection, sectionIdx);
                    }
                    continue;
                }

                if (field.valideaza !== undefined) {
                    const err = field.valideaza(formFieldValue.toString());
                    if (err != null) {
                        minErrorSection = Math.min(minErrorSection, sectionIdx);
                        errors[field.nume] = {
                            type: "field-invalid",
                            msg: err,
                            pag: sectionIdx,
                        };
                    }
                }

                // WARN: Needs testing with Multi-Select fields
                answers.push([field.nume, formFieldValue.toString()]);
            }
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors, pag: minErrorSection });
        }

        if (isEdit) {
            await overwriteAnswers(survey.id, answerId, new Map(answers));
        } else {
            await saveAnswers(
                /** @type {string} */ (email),
                survey.id,
                answerId,
                new Map(answers),
            );
            const sessionId = cookies.get("sessionid");
            if (sessionId) {
                await deleteSession(sessionId);
                cookies.delete("sessionid", { path: "/" });
            }
        }

        const redirectEmail = email
            ? `&email=${encodeURIComponent(email)}`
            : "";
        redirect(303, `/succes?answerId=${answerId}${redirectEmail}`);
    },
};
