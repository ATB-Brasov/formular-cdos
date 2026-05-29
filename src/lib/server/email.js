import { generateVerificationToken } from "./db.js";

function base64UrlEncode(data) {
    return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeBuffer(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return base64UrlEncode(binary);
}

/**
 * Parse a PEM-encoded RSA private key into PKCS#8 bytes.
 * Handles both actual newlines and literal "\n" escape sequences.
 */
function parsePem(pem) {
    const cleaned = pem.replace(/\\n/g, "\n");
    const lines = cleaned.split("\n");
    const b64 = lines
        .filter((l) => !l.includes("-----BEGIN") && !l.includes("-----END"))
        .join("");
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
}

/**
 * Get an OAuth2 access token using a Google service account JWT assertion.
 * @returns {Promise<string>}
 */
async function getAccessToken() {
    const saEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKeyPem = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
    const impersonateUser = Deno.env.get("GMAIL_USER");

    if (!saEmail || !privateKeyPem || !impersonateUser) {
        throw new Error(
            "GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GMAIL_USER must be set",
        );
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
        iss: saEmail,
        sub: impersonateUser,
        scope: "https://www.googleapis.com/auth/gmail.send",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const claimEncoded = base64UrlEncode(JSON.stringify(claim));
    const signingInput = `${headerEncoded}.${claimEncoded}`;

    const keyData = parsePem(privateKeyPem);
    const key = await crypto.subtle.importKey(
        "pkcs8",
        keyData,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const sig = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        key,
        new TextEncoder().encode(signingInput),
    );

    const jwt = `${signingInput}.${base64UrlEncodeBuffer(sig)}`;

    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(
            `Gmail OAuth error: ${data.error_description || data.error} (status ${resp.status})`,
            { cause: data },
        );
    }
    return data.access_token;
}

/**
 * Build a base64url-encoded RFC 2822 email message.
 */
function buildRawMessage(from, to, subject, htmlBody) {
    const encoder = new TextEncoder();
    const toBytes = (s) => Array.from(encoder.encode(s), (b) =>
        String.fromCharCode(b)
    ).join("");

    const subjectEncoded = btoa(toBytes(subject));
    const bodyEncoded = btoa(toBytes(htmlBody));

    const message = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${subjectEncoded}?=`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        bodyEncoded,
    ].join("\r\n");

    return base64UrlEncode(message);
}

/**
 * Send an email via the Gmail API.
 */
async function sendGmail(accessToken, { from, to, subject, htmlBody }) {
    const raw = buildRawMessage(from, to, subject, htmlBody);

    const resp = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
        },
    );

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Gmail API error: ${err}`);
    }

    return await resp.json();
}

/**
 * Send a verification email after a form submission.
 * @param {string} to - Recipient email address
 * @param {string} answerId - The answer UUID
 * @param {string} email - The submitter's email (for the token)
 * @param {string} origin - Base URL for building links
 */
export async function sendVerificationEmail(to, answerId, email, origin) {
    const token = await generateVerificationToken(answerId, email);

    const verifyLink = `${origin}/verificare?answerId=${encodeURIComponent(answerId)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const editLink = `${origin}/edit?answerId=${encodeURIComponent(answerId)}`;
    const deleteLink = `${origin}/sterge-date?answerId=${encodeURIComponent(answerId)}&email=${encodeURIComponent(email)}`;

    const from = Deno.env.get("GMAIL_USER") || "noreply@atbbrasov.ro";
    const subject = "Verifică-ți răspunsul — Formular ATB CDOS";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Mulțumim pentru participare!</h2>
  <p>Răspunsul tău a fost înregistrat cu succes.</p>
  <p>Pentru a ajuta la validarea statistică a rezultatelor, te rugăm să îți confirmi adresa de e-mail apăsând pe linkul de mai jos:</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Confirmă adresa de e-mail
    </a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="font-size: 14px; color: #6b7280;">
    Poți să îți <a href="${editLink}" style="color: #2563eb;">modifici răspunsurile</a>
    sau să le <a href="${deleteLink}" style="color: #dc2626;">ștergi complet</a> în orice moment.
  </p>
  <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
    Acest e-mail a fost trimis automat. Dacă nu ai completat formularul, te rugăm să ignori acest mesaj.
  </p>
</body>
</html>`;

    const accessToken = await getAccessToken();
    await sendGmail(accessToken, { from, to, subject, htmlBody });
    console.log(`Verification email sent to ${to} for answer ${answerId}`);
}
