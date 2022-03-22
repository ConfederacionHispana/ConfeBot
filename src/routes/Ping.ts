import type { PieceContext } from '@sapphire/framework';
import { ApiRequest, ApiResponse, methods, Route, RouteOptions } from '@sapphire/plugin-api';

export class PingRoute extends Route {
  public constructor(context: PieceContext, options?: RouteOptions) {
    super(context, {
      ...options,
      route: 'ping'
    });
  }

  public [methods.GET](_request: ApiRequest, response: ApiResponse): void {
    const { client } = this.container;
    response.json({ message: 'Pong!', latency: client.ws.ping });
  }
}
