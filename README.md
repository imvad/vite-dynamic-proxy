# vite-dynamic-proxy

A Vite plugin that enables dynamic proxy configuration at runtime, allowing flexible and configurable proxy settings for development servers.

## Installation

```bash
npm install vite-dynamic-proxy
```

## Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import dynamicProxy from 'vite-dynamic-proxy'

export default defineConfig({
  plugins: [
    dynamicProxy({
      // configuration options
    })
  ]
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
