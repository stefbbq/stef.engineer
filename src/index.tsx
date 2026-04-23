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
