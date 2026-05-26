import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const allowedHosts = Deno.env.get("VITE_ALLOWED_HOSTS");
const extraAllowedHosts = allowedHosts
    ? allowedHosts.split(",").map((s) => s.trim())
    : [];

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    server: {
        ...(extraAllowedHosts.length > 0
            ? { allowedHosts: extraAllowedHosts }
            : {}),
        watch: {
            ignored: [
                "**/node_modules/**",
                /(^|[\/\\])\../,
            ],
        },
    },
});
