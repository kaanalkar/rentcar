import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';

class DemoLoginDto {
  email: string;
  id: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login-demo')
  @ApiOperation({ summary: 'DEMO: Returns a JWT for given id+email (dev only)' })
  loginDemo(@Body() dto: DemoLoginDto) {
    const accessToken = this.auth.sign({ id: dto.id, email: dto.email, roles: ['USER'] });
    return { accessToken };
  }
}
