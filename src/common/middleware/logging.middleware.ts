import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const ms = Date.now() - start;
      const status = res.statusCode;
      console.log(
        JSON.stringify({
          time: new Date().toISOString(),
          method,
          url: originalUrl,
          status,
          ms,
        }),
      );
    });
    next();
  }
}
