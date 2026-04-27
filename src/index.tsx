import { createERSApp } from '@touchlesscode/core/edge'
import { createLogger } from '@touchlesscode/log'

const logger = createLogger('stef-online')

// eager-load route + layout modules so both the worker handler and the
// WebSocket DurableObject can see them without going through virtual registries.
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
 * fresh DO name per worker-isolate startup so every wrangler restart and every
 * production deploy lands on a brand-new Durable Object instance. the framework
 * default routes WS upgrades to `idFromName('default')` which would let a
 * miniflare-persisted DO outlive the bundle that created it; intercepting at
 * the worker level here forces a clean DO each time the worker code reloads.
 *
 * this is also the reason our `WebSocketServer` class below can safely delegate
 * to the framework's own `app.WebSocketServer` without losing the "no stale
 * ContentCache across deploys" guarantee — the DO id rotation is what prevents
 * leaks, not any custom omission of ContentCache from the processor graph.
 */
const doInstanceName = `ers-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // intercept WebSocket upgrades before the framework's default handler so
    // they route to our fresh-per-isolate DO id instead of `idFromName('default')`.
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

/**
 * WebSocket DurableObject — thin delegator around the framework-built
 * `app.WebSocketServer` (exo-atlas pattern).
 *
 * delegating gets us the framework's full processor graph for free, including
 * the per-request `FABRIC_CALL` processor wired in `createERSApp` — which is
 * what lets fabric RPC travel over the socket. the fresh-per-isolate
 * `doInstanceName` rotation above prevents any in-memory `ContentCache` from
 * carrying state across deploys.
 */
// eslint-disable-next-line functional/no-classes
export class WebSocketServer {
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly state: DurableObjectState
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly env: any

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const app = await appPromise
    const FrameworkWebSocketServer = app.WebSocketServer
    const instance = new FrameworkWebSocketServer(this.state as never, this.env)
    return instance.fetch(request)
  }
}
