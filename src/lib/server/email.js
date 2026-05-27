import { generateVerificationToken } from "./db.js";

/**
 * Get an OAuth2 access token using the Gmail API refresh token flow.
 * @returns {Promise<string>}
 */
async function getAccessToken() {
    const clientId = Deno.env.get("GMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN must be set");
    }

    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(
            `Gmail OAuth error: ${data.error_description || data.error}`,
        );
    }
    return data.access_token;
}

function base64UrlSafe(str) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

    return base64UrlSafe(message);
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

    let accessToken;
    try {
        accessToken = await getAccessToken();
    } catch (err) {
        console.error("Failed to get Gmail access token:", err);
        return;
    }

    try {
        await sendGmail(accessToken, { from, to, subject, htmlBody });
        console.log(`Verification email sent to ${to} for answer ${answerId}`);
    } catch (err) {
        console.error(`Failed to send verification email to ${to}:`, err);
    }
}
