// Assisted-By: Gemini 3 Flash
export async function solvePoW(email, difficulty = 4) {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    const encoder = new TextEncoder();

    while (true) {
        const data = encoder.encode(`${email}:${nonce}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (hashHex.startsWith(prefix)) {
            return nonce;
        }
        nonce++;
    }
}
