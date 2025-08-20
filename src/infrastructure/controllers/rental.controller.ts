import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
  Req,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Delete,
  UseGuards,
  NotFoundException,
  StreamableFile,
  Res
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConflictException, InternalServerErrorException } from '@nestjs/common/exceptions';

import {
  CreateRentalDto,
  ReturnRentalDto,
  CancelRentalDto,
  ListAvailableCarsQueryDto,
  PresignUploadDto,
  RegisterDto,
  LoginDto,
  CreateCarDto,
} from '../dtos/dtos';

import type {
  CreateRentalPort,
  ListAvailableCarsPort,
  ReturnRentalPort,
  CancelRentalPort,
  CreateCarPort,
  DeleteCarPort,
} from '../../application/ports/in/car-rental-in.ports';

import type {
  FileStoragePort,
  UserRepositoryPort,
} from '../../application/ports/out/car-rental-out.ports';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ExportService } from '../../application/services/export.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

/* ------------------------------------------------------------------ */
/* RENTAL                                                             */
/* ------------------------------------------------------------------ */
@ApiTags('rental')
@Controller('rental')
export class RentalController {
  constructor(
    @Inject('CreateRentalPort') private readonly createRental: CreateRentalPort,
    @Inject('ListAvailableCarsPort') private readonly listCars: ListAvailableCarsPort,
    @Inject('ReturnRentalPort') private readonly returnRental: ReturnRentalPort,
    @Inject('CancelRentalPort') private readonly cancelRental: CancelRentalPort,
    @Inject('FileStoragePort') private readonly fileStorage?: FileStoragePort,
    private readonly exportService?: ExportService,
  ) {}

  @Get('available-cars')
  @ApiOperation({ summary: 'List available cars' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  list(@Query() q: ListAvailableCarsQueryDto) {
    return this.listCars.execute(q.toFilter());
  }

    @Post()
  @ApiOperation({ summary: 'Create rental' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() dto: CreateRentalDto) {
    try {
      return await this.createRental.execute(dto);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/User not allowed to rent/i.test(msg)) {
        throw new BadRequestException('User not allowed to rent');
      }
      if (/Car not available/i.test(msg)) {
        throw new BadRequestException('Car not available');
      }
      if (/Car already rented/i.test(msg)) {
        throw new ConflictException('Car already rented');
      }
      if (/User already has an active rental/i.test(msg)) {
        throw new ConflictException('User already has an active rental');
      }
      if (/User not found/i.test(msg)) {
        throw new NotFoundException('User not found');
      }
      if (/Invalid rental/i.test(msg)) {
        throw new BadRequestException('Invalid rental');
      }

      throw new InternalServerErrorException();
    }
  }

  @Patch('return')
  @ApiOperation({ summary: 'Return rental' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  return(@Body() dto: ReturnRentalDto) {
    return this.returnRental.execute(dto);
  }

  @Patch('cancel')
  @ApiOperation({ summary: 'Cancel rental (RESERVED only)' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  cancel(@Body() dto: CancelRentalDto) {
    return this.cancelRental.execute(dto);
  }

  @Post('car-image/presign')
  @ApiOperation({ summary: 'Get S3 presigned PUT URL for car image (optional)' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async presign(@Body() dto: PresignUploadDto) {
    if (!this.fileStorage) return { message: 'File storage is not configured' };
    const url = await this.fileStorage.getPresignedPutUrl(dto.key, 900);
    return { url, expiresIn: 900, key: dto.key };
  }

  /* ------------------------------------------------------------------ */
/* EXPORT                                                             */
/* ------------------------------------------------------------------ */

  @Get(':id/export')
  @ApiOperation({ summary: 'Export rental as PDF or Excel' })
  @ApiBearerAuth()
    async exportRental(
      @Param('id', new ParseUUIDPipe()) id: string,
      @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
      @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
    const { filename, mime, buffer } = await this.exportService!.exportRental(id, format);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
}
}

/* ------------------------------------------------------------------ */
/* AUTH (register & login)                                            */
/* ------------------------------------------------------------------ */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject('UserRepositoryPort') private readonly users: UserRepositoryPort,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async register(@Body() dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = new User(
      undefined as any,
      dto.email,
      dto.fullName,
      dto.driverLicenseNo,
      undefined,
      [UserRole.USER],
      hash,
    );
    const saved = await this.users.save(user);
    return { id: saved.id, email: saved.email };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(@Body() dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.auth.sign({ id: user.id, email: user.email, roles: user.roles });
    return { accessToken };
  }
}

/* ------------------------------------------------------------------ */
/* USERS                                                              */
/* ------------------------------------------------------------------ */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject('UserRepositoryPort') private readonly users: UserRepositoryPort, 
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user (from DB by JWT subject)' })
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) throw new NotFoundException('User not found in token');

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      driverLicenseNo: user.driverLicenseNo,
      status: user.status,
      roles: user.roles,
    };
  }
}

/* ------------------------------------------------------------------ */
/* CARS (available + ADMIN create/delete)                             */
/* ------------------------------------------------------------------ */
@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(
    @Inject('ListAvailableCarsPort') private readonly listCars: ListAvailableCarsPort,
    @Inject('CreateCarPort') private readonly createCar: CreateCarPort,
    @Inject('DeleteCarPort') private readonly deleteCar: DeleteCarPort,
    @Inject('FileStoragePort') private readonly fileStorage?: FileStoragePort,
  ) {}

  @Get('available')
  @ApiOperation({ summary: 'List available cars (alias of rental/available-cars)' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  list(@Query() q: ListAvailableCarsQueryDto) {
    return this.listCars.execute(q.toFilter());
  }

  @Post()
  @ApiOperation({ summary: 'Create car (ADMIN)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Req() req: any, @Body() dto: CreateCarDto) {
    const roles: string[] = req.user?.roles ?? [];
    if (!roles.includes('ADMIN')) throw new ForbiddenException('ADMIN role required');
    return this.createCar.execute(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete car (ADMIN)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    const roles: string[] = req.user?.roles ?? [];
    if (!roles.includes('ADMIN')) throw new ForbiddenException('ADMIN role required');
    await this.deleteCar.execute(id);
    return { ok: true };
  }
}

