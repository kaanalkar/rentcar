import { IsUUID, IsDateString, IsOptional, IsNumberString, IsEmail, MinLength, IsString, IsNumber, Min, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRentalDto {
  @IsUUID() carId: string;
  @IsUUID() userId: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

export class ReturnRentalDto {
  @ApiProperty() @IsUUID() rentalId: string;
  @ApiProperty() @IsUUID() userId: string;
}

export class CancelRentalDto {
  @ApiProperty() @IsUUID() rentalId: string;
  @ApiProperty() @IsUUID() userId: string;
}

export class ListAvailableCarsQueryDto {
  @ApiPropertyOptional({ description: 'Min price', example: '500' })
  @IsOptional() @IsNumberString() minPrice?: string;

  @ApiPropertyOptional({ description: 'Max price', example: '1500' })
  @IsOptional() @IsNumberString() maxPrice?: string;

  toFilter() {
    const min = this.minPrice != null ? Number(this.minPrice) : undefined;
    const max = this.maxPrice != null ? Number(this.maxPrice) : undefined;
    return { minPrice: min, maxPrice: max };
  }
}

export class PresignUploadDto {
  @ApiProperty({ example: 'cars/abc-123.jpg' }) key: string;
}

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() fullName: string;
  @ApiProperty() @IsString() driverLicenseNo: string;
  @ApiProperty() @MinLength(6) password: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @MinLength(6) password: string;
}

export class CreateCarDto {
  @ApiProperty() @IsString() brand: string;
  @ApiProperty() @IsString() model: string;
  @ApiProperty() @IsNumber() @Min(0) dailyPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}
