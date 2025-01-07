import { describe, it, expect } from 'vitest'
import { dynamicProxyPlugin, DynamicProxyOptions } from './index'

describe('vite-dynamic-proxy', () => {
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
  })
})
