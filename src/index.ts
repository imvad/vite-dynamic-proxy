import { Plugin, ProxyOptions, ViteDevServer } from "vite";
import { IncomingMessage, ServerResponse } from "http";

interface ProxyOptionsWithTarget extends ProxyOptions {
  target: string;
}

export interface DynamicProxyOptions {
  defaultTarget: string;
  path: string;
  changeOrigin?: boolean;
}

export function dynamicProxyPlugin(options: DynamicProxyOptions): Plugin {
  // Validate required options
  if (!options.defaultTarget) {
    throw new Error("vite-dynamic-proxy: defaultTarget is required");
  }
  if (!options.path) {
    throw new Error("vite-dynamic-proxy: path is required");
  }
  // Validate path format - should be either a simple path or start with ^
  if (!/^(\^)?\/[\w\-/]*$/.test(options.path)) {
    throw new Error(
      'vite-dynamic-proxy: path must be a valid path (e.g., "/api") or start with ^ (e.g., "^/api")'
    );
  }

  const defaultTarget = options.defaultTarget;
  const path = options.path;
  const changeOrigin = options.changeOrigin ?? true;

  console.log("\nvite-dynamic-proxy plugin configuration:");
  console.log("- defaultTarget:", defaultTarget);
  console.log("- path:", path);
  console.log("- changeOrigin:", changeOrigin, "\n");

  let lastDebugTarget: string | undefined;

  return {
    name: "vite-dynamic-proxy",
    configureServer(server: ViteDevServer) {
      server.config.server.proxy = {
        [path]: {
          target: defaultTarget,
          changeOrigin,
        },
      };

      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!req.url) {
            next();
            return;
          }

          const url = new URL(req.url, `http://${req.headers.host}`);
          // If path starts with ^, treat as regex, otherwise use startsWith
          const matches = path.startsWith("^")
            ? new RegExp(path).test(url.pathname)
            : url.pathname.startsWith(path);
          if (matches) {
            const referer = req.headers.referer;
            if (referer) {
              const refererUrl = new URL(referer);
              const debug = refererUrl.searchParams.get("debug");
              if (debug) {
                let debugTarget: string;
                if (debug.startsWith("https://")) {
                  debugTarget = debug;
                } else if (debug.startsWith("http://")) {
                  debugTarget = debug;
                } else {
                  debugTarget = `http://${debug}`;
                }

                if (debugTarget !== lastDebugTarget) {
                  console.log("vite-dynamic-proxy: Proxying to:", debugTarget);
                  lastDebugTarget = debugTarget;
                }

                // Update server proxy configuration
                if (server.config.server && server.config.server.proxy) {
                  const proxy = server.config.server.proxy as Record<
                    string,
                    ProxyOptionsWithTarget
                  >;
                  if (proxy[path]) {
                    proxy[path].target = debugTarget;
                    if (debugTarget.startsWith("https://")) {
                      proxy[path].secure = false;
                    }
                  }
                }
              }
            }
          }
          next();
        }
      );
    },
  };
}
