# vite-dynamic-proxy

[![npm version](https://badge.fury.io/js/vite-dynamic-proxy.svg)](https://badge.fury.io/js/vite-dynamic-proxy)
[![CI](https://github.com/imvad/vite-dynamic-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/imvad/vite-dynamic-proxy/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A Vite plugin that enables dynamic proxy configuration at runtime, allowing you to change proxy target using URL query parameters without restarting the development server.

## Installation

```bash
npm install vite-dynamic-proxy
```

## Usage

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { dynamicProxyPlugin } from 'vite-dynamic-proxy'

export default defineConfig({
  plugins: [
    dynamicProxyPlugin({
      // Required: Default target URL for the proxy
      defaultTarget: 'http://localhost:3000',
      
      // Required: Path to proxy (e.g., '/api' or '^/api')
      path: '/api',
      
      // Optional: Change origin header (default: true)
      changeOrigin: true
    })
  ]
})
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `defaultTarget` | `string` | Default target URL for the proxy (required) | - |
| `path` | `string` | Path to proxy, can be a simple path or regex starting with ^ (required) | - |
| `changeOrigin` | `boolean` | Changes the origin of the host header | `true` |

### Dynamic Proxy Target

You can change the proxy target at runtime by adding a `debug` query parameter to your URL. The plugin supports both HTTP and HTTPS targets:

```
# Using HTTP
http://localhost:5173/your-app?debug=localhost:3001

# Using explicit HTTP
http://localhost:5173/your-app?debug=http://localhost:3001

# Using HTTPS
http://localhost:5173/your-app?debug=https://api.example.com
```

When using HTTPS targets, the plugin automatically sets `secure: false` to allow self-signed certificates.

### Path Matching Examples

```typescript
// Simple path matching
dynamicProxyPlugin({
  defaultTarget: 'http://localhost:3000',
  path: '/api'  // Will match paths starting with /api
})

// Regex path matching
dynamicProxyPlugin({
  defaultTarget: 'http://localhost:3000',
  path: '^/api'  // Will match paths using regex pattern
})
```

## Development

- `npm install` - Install dependencies
- `npm run build` - Build the plugin
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## License

ISC
