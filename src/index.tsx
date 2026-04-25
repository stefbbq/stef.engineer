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

/**
 * fresh DO name per worker-isolate start, so every `wrangler dev` reload
 * (and every production deploy) picks a brand new Durable Object instance.
 * the framework default routes all WS upgrades to `idFromName('default')`,
 * which keeps serving stale route-HTML out of its in-memory ContentCache
 * after the script bundle rebuilds. generating a fresh name on module init
 * orphans the old DO and forces a clean one.
 */
const doInstanceName = `ers-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // intercept WebSocket upgrades ourselves so we can pick a fresh DO ID
    // per-isolate rather than the framework's hardcoded 'default' name.
    const upgrade = request.headers.get('Upgrade')
    if (upgrade === 'websocket' && env?.WEBSOCKET_DO) {
      const doId = env.WEBSOCKET_DO.idFromName(doInstanceName)
      const stub = env.WEBSOCKET_DO.get(doId)
      return stub.fetch(request)
    }

    const app = await appPromise
    return app.handler.fetch(request, env, ctx)
  },
}

/** durable object class for ERS WebSocket connections */
export class WebSocketServer {
  private readonly state: DurableObjectState
  private readonly env: any
  private inner: any = null

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    if (!this.inner) {
      const app = await appPromise
      const Klass = app.WebSocketServer
      this.inner = new Klass(this.state, this.env)
    }
    return this.inner.fetch(request)
  }
}
