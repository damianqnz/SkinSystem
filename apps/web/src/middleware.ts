/**
 * @description: Gestiona la detección de subdominios (tenants) y la negociación de idioma (i18n).
 * @security: Previene el acceso a rutas de otros tenants mediante el aislamiento de hostname.
 * @traceability: Inbound Request -> Subdomain Extraction -> i18n Detection -> URL Rewrite
 * @mermaid:
 * graph TD
 * A[Request] --> B{Tiene Subdominio?}
 * B -- Sí --> C[Extraer Tenant: lourdes/gloria]
 * B -- No --> D[Main Landing]
 * C --> E{Tiene Cookie Idioma?}
 * E -- No --> F[Detectar Browser Lang]
 * F --> G[Set Locale]
 * G --> H[Rewrite a /src/app/tenant/locale]
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Configuración de idiomas soportados
const locales = ['es', 'pt', 'en'];
const defaultLocale = 'en';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';

    // 2. Lógica de Subdominio (Tenant)
    // En local: lourdes.localhost:3000 -> tenant = lourdes
    // En prod: lourdes.beautyplatform.com -> tenant = lourdes
    const currentHost =
        process.env.NODE_ENV === "production" && process.env.VERCEL_URL
            ? hostname.replace(`.beautyplatform.com`, "")
            : hostname.replace(`.localhost:3000`, "");

    // Si no hay subdominio o es 'www', lo mandamos a la landing principal
    const isMainDomain = currentHost === "localhost:3000" || currentHost === "www" || currentHost === "";

    // 3. Lógica de Idioma (i18n) usando la API asíncrona de Cookies
    // Nota: En middleware usamos request.cookies.get() que es el estándar de Next.js
    let locale = request.cookies.get('NEXT_LOCALE')?.value;

    if (!locale) {
        // Si no hay cookie, detectamos el idioma del navegador
        const acceptLanguage = request.headers.get('accept-language');
        if (acceptLanguage) {
            const firstLang = acceptLanguage.split(',')[0];
            const preferredLocale = firstLang ? (firstLang.split('-')[0] ?? '') : '';
            locale = locales.includes(preferredLocale) ? preferredLocale : defaultLocale;
        } else {
            locale = defaultLocale;
        }
    }

    // 4. Reescritura de URL (Rewrite)
    // Esto hace que el usuario vea 'lourdes.com/reservar' 
    // pero el servidor lea 'app/[tenant]/[locale]/reservar'
    if (!isMainDomain) {
        // Evitar bucles de redirección
        if (url.pathname.startsWith(`/${currentHost}`)) {
            return NextResponse.next();
        }

        url.pathname = `/${currentHost}/${locale}${url.pathname}`;

        // Seteamos la cookie de idioma si no existía para futuras peticiones
        const response = NextResponse.rewrite(url);
        response.cookies.set('NEXT_LOCALE', locale as string, {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        return response;
    }

    return NextResponse.next();
}

// Limitamos el middleware para que no corra en archivos estáticos (imágenes, fuentes, etc.)
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\.svg$).*)',
    ],
};