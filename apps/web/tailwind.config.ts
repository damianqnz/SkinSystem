import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/domains/**/*.{js,ts,jsx,tsx,mdx}", //  Vital para dominios
        "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",  // Componentes compartidos
        "./src/infrastructure/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{ts,tsx}",   // Componentes del monorepo
    ],
    theme: {
        extend: {
            colors: {
                // Conexión con DESIGN_SYSTEM.md
                primary: "var(--primary)",
                accent: "var(--accent)",
                background: "var(--background)",
            },
            fontFamily: {
                // Fuentes minimalistas de Fontsource
                serif: ["Cormorant Garamond", "serif"],
                sans: ["Outfit", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;