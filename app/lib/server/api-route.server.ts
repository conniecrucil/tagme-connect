export type LegacyRequestHandler = (request: Request, context: any) => Promise<Response> | Response;

type LegacyNetlifyHandlerResult = { statusCode?: number; headers?: HeadersInit; body?: string } | void;
type LegacyApiModule = Record<string, unknown>;

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const legacyApiModuleImporters = import.meta.glob<LegacyApiModule>("./api-legacy/*.{js,ts}");

async function importLegacyApiModule(moduleName: string) {
  const importer =
    legacyApiModuleImporters[`./api-legacy/${moduleName}.ts`] ??
    legacyApiModuleImporters[`./api-legacy/${moduleName}.js`];

  if (!importer) {
    throw new Error(`Unknown legacy API module: ${moduleName}`);
  }

  return importer();
}

export async function runLegacyApiModule(moduleName: string, request: Request) {
  try {
    const mod = await importLegacyApiModule(moduleName);
    const handler = mod.default as LegacyRequestHandler | undefined;
    if (!handler) {
      return jsonError(500, `Legacy API module missing default export: ${moduleName}`);
    }
    return await handler(request, {});
  } catch (error) {
    console.error(`Error in API endpoint ${moduleName}:`, error);
    return jsonError(500, error instanceof Error ? error.message : "Internal server error");
  }
}

function legacyEventFromRequest(request: Request) {
  const url = new URL(request.url);

  return {
    httpMethod: request.method,
    path: url.pathname,
    rawUrl: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    body: null,
    isBase64Encoded: false,
  };
}

export async function runLegacyNetlifyHandlerModule(moduleName: string, request: Request, exportName = "handler") {
  try {
    const mod = await importLegacyApiModule(moduleName);
    const handler = mod[exportName] as ((event: any, context: any, callback: any) => Promise<LegacyNetlifyHandlerResult> | LegacyNetlifyHandlerResult) | undefined;

    if (!handler) {
      return jsonError(500, `Legacy API module missing export '${exportName}': ${moduleName}`);
    }

    const result = await handler(legacyEventFromRequest(request), {}, () => {});
    if (!result) {
      return jsonError(500, `${moduleName} handler returned no response`);
    }

    return new Response(result.body ?? "", {
      status: result.statusCode ?? 200,
      headers: result.headers,
    });
  } catch (error) {
    console.error(`Error in Netlify-style API endpoint ${moduleName}:`, error);
    return jsonError(500, error instanceof Error ? error.message : "Internal server error");
  }
}
