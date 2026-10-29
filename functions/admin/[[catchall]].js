// Handler para ruta privada /admin en Cloudflare Pages
export async function onRequest(context) {
  const { request, env } = context;

  // Servir el asset SPA principal (index.html)
  const indexUrl = new URL("/", request.url);
  let response;
  try {
    response = await env.ASSETS.fetch(new Request(indexUrl, request));
  } catch (err) {
    return new Response("URBANNOISE CMS Loading...", {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      },
    });
  }

  let html = await response.text();

  if (html.includes('<meta name="robots"')) {
    html = html.replace(
      /<meta\s+name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />'
    );
  } else {
    html = html.replace(
      '</head>',
      '  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />\n  </head>'
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  return new Response(html, {
    status: 200,
    headers,
  });
}
