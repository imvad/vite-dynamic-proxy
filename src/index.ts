import { Plugin, ProxyOptions, ViteDevServer } from "vite";
import { IncomingMessage, ServerResponse } from "http";

interface ProxyOptionsWithTarget extends ProxyOptions {
  target: string;
}

export interface DynamicProxyOptions {
  defaultTarget: string;
  path: string | string[];
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
  
  const defaultTarget = options.defaultTarget;
  const paths = Array.isArray(options.path) ? options.path : [options.path];
  const changeOrigin = options.changeOrigin ?? true;
  
  // Validate path format for each path
  paths.forEach(path => {
    if (!/^(\^)?\/[\w\-/]*$/.test(path)) {
      throw new Error(
        `vite-dynamic-proxy: path "${path}" must be a valid path (e.g., "/api") or start with ^ (e.g., "^/api")`
      );
    }
  });

  console.log("\nvite-dynamic-proxy plugin configuration:");
  console.log("- defaultTarget:", defaultTarget);
  console.log("- paths:", paths);
  console.log("- changeOrigin:", changeOrigin, "\n");

  let lastDebugTarget: string | undefined;

  return {
    name: "vite-dynamic-proxy",
    configureServer(server: ViteDevServer) {
      // Create proxy configuration for each path
      const proxyConfig: Record<string, ProxyOptionsWithTarget> = {};
      
      paths.forEach(path => {
        proxyConfig[path] = {
          target: defaultTarget,
          changeOrigin,
        };
      });
      
      server.config.server.proxy = proxyConfig;

      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!req.url) {
            next();
            return;
          }

          const url = new URL(req.url, `http://${req.headers.host}`);
          
          // Check if the URL matches any of our paths
          const matchingPath = paths.find(path => {
            // If path starts with ^, treat as regex, otherwise use startsWith
            return path.startsWith("^")
              ? new RegExp(path).test(url.pathname)
              : url.pathname.startsWith(path);
          });
          
          if (matchingPath) {
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

                // Update server proxy configuration for all paths
                if (server.config.server && server.config.server.proxy) {
                  const proxy = server.config.server.proxy as Record<
                    string,
                    ProxyOptionsWithTarget
                  >;
                  
                  // Update all paths to use the debug target
                  paths.forEach(path => {
                    if (proxy[path]) {
                      proxy[path].target = debugTarget;
                      if (debugTarget.startsWith("https://")) {
                        proxy[path].secure = false;
                      }
                    }
                  });
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
