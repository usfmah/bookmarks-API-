import { Controller, Get } from '@nestjs/common';

/** Minimal, non-sensitive liveness probe for container health checks. */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

