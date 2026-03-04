/** @type {import('../echipa/$types').PageServerLoad} */
export async function load(event) {
    return { };
}

/** @satisfies {import('../echipa/$types').Actions} */
export const actions = {
    default: async ({request}) => { 
        const data = await request.formData();
        const posta = data.get("posta");

        if (!posta) {
            return { error: "POSTA", msg: "Introdu adresa poștei electronice!", pag: 1, posta }
        }
        if (!posta.endsWith("@student.unitbv.ro") && !posta.endsWith("@unitbv.ro")) {
            return { error: "POSTA", msg: "Folosește adresa instituțională!", posta }
        }
        return { success: true };
    },
}


