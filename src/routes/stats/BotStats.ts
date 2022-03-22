import type { PieceContext } from '@sapphire/framework';
import { ApiRequest, ApiResponse, methods, Route, RouteOptions } from '@sapphire/plugin-api';
import { authenticated } from '../../lib/util/api/authenticated';

export class BotStatsRoute extends Route {
  public constructor(context: PieceContext, options?: RouteOptions) {
    super(context, {
      ...options,
      route: 'stats/bot'
    });
  }

  @authenticated()
  public [methods.GET](_request: ApiRequest, response: ApiResponse): void {
    const { client } = this.container;
    response.json({
      environment: process.env.NODE_ENV || 'development',
      guilds: client.guilds.cache.size,
      latency: client.ws.ping,
      memory: {
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        rss: process.memoryUsage().rss
      },
      uptime: process.uptime(),
    });
  }
}
