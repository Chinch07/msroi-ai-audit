import { Html, Head, Main, NextScript } from 'next/document';

// Optional. Set NEXT_PUBLIC_GTM_ID in Vercel to enable Google Tag Manager;
// when it's unset (local dev, or before a container exists) nothing is
// injected at all rather than loading a broken/foreign container. This is a
// NEXT_PUBLIC_ var because it must be inlined into the client bundle at
// build time — changing it requires a redeploy, not just an env edit.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Tag Manager — as high in <head> as possible, per GTM's own
            install instructions. The ID comes from build-time env, not user
            input, so dangerouslySetInnerHTML here carries no injection risk. */}
        {GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}

        {/* Roboto Slab is BRAND.fontDisplay — every heading in the app renders
            in it, so it's loaded here rather than left to a fallback.
            display=swap shows the Georgia fallback immediately instead of
            blocking paint on the font request.
            No jsPDF script: "Export PDF" is window.print() with the print
            stylesheet in globals.css, not client-side PDF generation. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        {/* GTM noscript — immediately after the opening <body>, per GTM. */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
