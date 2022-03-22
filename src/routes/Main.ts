import type { PieceContext } from '@sapphire/framework';
import { ApiRequest, ApiResponse, methods, Route, RouteOptions } from '@sapphire/plugin-api';

export class IndexRoute extends Route {
  public constructor(context: PieceContext, options?: RouteOptions) {
    super(context, {
      ...options,
      route: ''
    });
  }

  public [methods.GET](_request: ApiRequest, response: ApiResponse): void {
    const { client } = this.container;
    response.json({ message: `Hello from ConfeBot v${client.version}!` });
  }

  public [methods.POST](_request: ApiRequest, response: ApiResponse): void {
    const { client } = this.container;
    response.json({ message: `Hello from ConfeBot v${client.version}!` });
  }
}
