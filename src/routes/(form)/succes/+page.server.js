/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    cookies.delete('sessionid', { path: '/' });
    return {};
}
