import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dynamicProxyPlugin, DynamicProxyOptions } from './index'
import type { ViteDevServer } from 'vite'
import { IncomingMessage, ServerResponse } from 'http'
import { Connect } from 'vite'

type MiddlewareFunction = Connect.NextHandleFunction

interface MockServer {
  config: {
    server: {
      proxy?: Record<string, { target: string; changeOrigin?: boolean; secure?: boolean }>
    }
  }
  middlewares: {
    use: (fn: MiddlewareFunction) => void
  }
}

describe('vite-dynamic-proxy', () => {
  beforeEach(() => {
    console.log = vi.fn()
  })

  it('should throw error if required options are missing', () => {
    expect(() => dynamicProxyPlugin({} as DynamicProxyOptions)).toThrow('vite-dynamic-proxy: defaultTarget is required')
    expect(() => dynamicProxyPlugin({ defaultTarget: 'http://localhost:3000' } as DynamicProxyOptions)).toThrow('vite-dynamic-proxy: path is required')
  })

  it('should create plugin with valid options', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })
    expect(plugin.name).toBe('vite-dynamic-proxy')
    expect(plugin).toHaveProperty('configureServer')
  })

  it('should validate path format', () => {
    expect(() => dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: 'invalid-path'
    })).toThrow('vite-dynamic-proxy: path must be a valid path')

    // Valid paths should not throw
    expect(() => dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })).not.toThrow()

    expect(() => dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '^/api'
    })).not.toThrow()
  })

  it('should configure server with default proxy settings', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    const useMock = vi.fn<[MiddlewareFunction], void>()
    const server: MockServer = {
      config: {
        server: {
          proxy: {}
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    expect(server.config.server.proxy).toEqual({
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    })
  })

  it('should handle debug target in referer', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true
            }
          }
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    expect(middlewareFn).toBeDefined()
    if (!middlewareFn) return

    const req = {
      url: '/api/test',
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000?debug=localhost:8080'
      }
    } as IncomingMessage

    const res = {} as ServerResponse
    const next = vi.fn()

    middlewareFn(req, res, next)

    expect(server.config.server.proxy?.['/api'].target).toBe('http://localhost:8080')
    expect(next).toHaveBeenCalled()
  })

  it('should handle HTTPS debug targets', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true
            }
          }
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    expect(middlewareFn).toBeDefined()
    if (!middlewareFn) return

    const req = {
      url: '/api/test',
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000?debug=https://api.example.com'
      }
    } as IncomingMessage

    const res = {} as ServerResponse
    const next = vi.fn()

    middlewareFn(req, res, next)

    expect(server.config.server.proxy?.['/api'].target).toBe('https://api.example.com')
    expect(server.config.server.proxy?.['/api'].secure).toBe(false)
    expect(next).toHaveBeenCalled()
  })

  it('should handle regex path patterns', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '^/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {
            '^/api': {
              target: 'http://localhost:3000',
              changeOrigin: true
            }
          }
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    expect(middlewareFn).toBeDefined()
    if (!middlewareFn) return

    const req = {
      url: '/api/v1/test',
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000?debug=localhost:8080'
      }
    } as IncomingMessage

    const res = {} as ServerResponse
    const next = vi.fn()

    middlewareFn(req, res, next)

    expect(server.config.server.proxy?.['^/api'].target).toBe('http://localhost:8080')
    expect(next).toHaveBeenCalled()
  })

  it('should handle request with undefined url', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {}
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    const next = vi.fn()
    const req = {} as IncomingMessage
    const res = {} as ServerResponse

    middlewareFn!(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('should handle non-http/https debug target', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {}
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    const next = vi.fn()
    const req = {
      url: '/api/test',
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000?debug=localhost:4000'
      }
    } as IncomingMessage
    const res = {} as ServerResponse

    middlewareFn!(req, res, next)
    expect(server.config.server.proxy!['/api'].target).toBe('http://localhost:4000')
  })

  it('should handle explicit http debug target', () => {
    const plugin = dynamicProxyPlugin({
      defaultTarget: 'http://localhost:3000',
      path: '/api'
    })

    let middlewareFn: MiddlewareFunction | undefined
    const useMock = vi.fn<[MiddlewareFunction], void>((fn) => {
      middlewareFn = fn
    })
    const server: MockServer = {
      config: {
        server: {
          proxy: {}
        }
      },
      middlewares: {
        use: useMock
      }
    }

    const configureServerHook = plugin.configureServer as (server: ViteDevServer) => void
    configureServerHook(server as unknown as ViteDevServer)

    const next = vi.fn()
    const req = {
      url: '/api/test',
      headers: {
        host: 'localhost:3000',
        referer: 'http://localhost:3000?debug=http://localhost:4000'
      }
    } as IncomingMessage
    const res = {} as ServerResponse

    middlewareFn!(req, res, next)
    expect(server.config.server.proxy!['/api'].target).toBe('http://localhost:4000')
  })
})
