import type { PieceContext } from '@sapphire/framework';
import { ApiRequest, ApiResponse, methods, Route, RouteOptions } from '@sapphire/plugin-api';
import { authenticated } from '../../lib/util/api/authenticated';

export class CurrentUserRoute extends Route {
  public constructor(context: PieceContext, options?: RouteOptions) {
    super(context, {
      ...options,
      route: 'users/@me'
    });
  }

  @authenticated()
  public async [methods.GET](request: ApiRequest, response: ApiResponse): Promise<void> {
    const { server } = this.container;
    const auth = server.auth!;

    const data = await auth.fetchData(request.auth!.token);

    response.json(data.user);
  }
}
