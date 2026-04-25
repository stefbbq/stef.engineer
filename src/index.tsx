import { createERSApp } from '@touchlesscode/core/edge'
import { createLogger } from '@touchlesscode/log'

const logger = createLogger('stef-online')

// eager-load route + layout modules so both the worker handler and the
// WebSocket DurableObject (which doesn't get fromVirtualRegistry) can see them.
const routeModules = import.meta.glob<true, string, any>(
  ['./routes/*.fabric.tsx', '!./routes/_*'],
  { eager: true },
)

const layoutModules = import.meta.glob<true, string, any>(
  './routes/**/_layout.fabric.tsx',
  { eager: true },
)

const serverModules = import.meta.glob(
  './routes/**/*.fabric.tsx',
  { query: { 'fabric-server': true } },
)

const appPromise = createERSApp(logger, {
  appName: 'stef-online',
  componentRegistry: {} as any,
  routeModules,
  layoutModules,
  serverModules: serverModules as any,
})

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // refuse all websocket upgrades. the framework's WS path goes through a
    // long-lived Durable Object whose ContentCache holds rendered HTML across
    // bundle rebuilds and deploys, so SPA-nav over WS keeps re-injecting
    // stale `<style>` blocks (and other cached head fragments) from old
    // builds. by 503'ing the upgrade, the ERS client falls back to its
    // configured `transport: { type: 'fetch' }`, every nav re-renders fresh
    // through the worker's normal handler, and there's no cache surface.
    const upgrade = request.headers.get('Upgrade')
    if (upgrade === 'websocket') return new Response('WebSocket disabled', { status: 503 })

    const app = await appPromise
    return app.handler.fetch(request, env, ctx)
  },
}

/**
 * durable object class kept only so wrangler.jsonc's `WEBSOCKET_DO` binding
 * still resolves to a class. since our worker handler refuses every WS
 * upgrade above, this DO is never reached at runtime — its only job is to
 * exist so the migration in wrangler.jsonc has something to point at.
 */
export class WebSocketServer {
  constructor(_state: DurableObjectState, _env: any) {}
  async fetch(_request: Request): Promise<Response> {
    return new Response('WebSocket DO disabled', { status: 503 })
  }
}
