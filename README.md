# Chestionar CDOS — ATB

Aplicație web SvelteKit pentru completarea anonimă a chestionarelor de evaluare, destinată inițial colectării răspunsurilor pentru chestionarul de evaluare a cadrelor didactice de la **Universitatea Transilvania din Brașov**.

**Stare actuală:** Proiectul este hardcodat pentru organizația și chestionarul menționate mai sus. Datele de configurare (întrebări, opțiuni, facultăți, reguli de validare) sunt definite direct în codul sursă (`src/content/cestionare/`). Pentru a utiliza această aplicație în alt context, este necesară modificarea manuală a acestor fișiere.

## Tehnologii

- [SvelteKit](https://svelte.dev/) — framework web front-end & back-end
- [Deno](https://deno.com/) — runtime (cu suport KV integrat)
- [Tailwind CSS](https://tailwindcss.com/) — stilizare
- [Argon2](https://github.com/ranisalt/node-argon2) — hashing parole și e-mailuri

## Dezvoltare

```sh
# Pornește serverul de dezvoltare
deno task dev
```

## Producție

```sh
# Copiază și completează variabilele de mediu
cp .env.example .env
deno task build
deno task preview
```

Variabilele de mediu sunt definite într-un fișier `.env` (vezi [`.env.example`](./.env.example)):

| Variabilă            | Descriere                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `HASH_SECRET`        | Secret pentru hashingul adreselor de e-mail                                                 |
| `HASH_SALT`          | Salt pentru hashingul adreselor de e-mail                                                   |
| `HASH_CONTROL`       | Hash Argon2 al parolei pentru panoul de administrare                                        |
| `EXPORT_API_TOKEN`   | Token pentru exportul programatic al răspunsurilor                                          |
| `ADMIN_AUTH_ENABLED` | Activează/dezactivează autentificarea pe panoul de administrare (opțional, implicit `true`) |
| `PUBLIC_ORIGIN`      | Originea URL-ului părinte pentru iframe postMessage (opțional, implicit `*`)                |

## Licență

[AGPL-3.0](./LICENSE)
