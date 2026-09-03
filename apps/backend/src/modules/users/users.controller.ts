import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpdateProfileSchema,
  CreateAddressDto,
  CreateAddressSchema,
} from './dto/user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('addresses')
  async getAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('addresses')
  async createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(CreateAddressSchema)) dto: CreateAddressDto
  ) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') addressId: string
  ) {
    return this.usersService.deleteAddress(user.id, addressId);
  }

  @Patch('addresses/:id/default')
  async setDefaultAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') addressId: string
  ) {
    return this.usersService.setDefaultAddress(user.id, addressId);
  }

  // Admin Routes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getAllUsers(pageNum, limitNum, search);
  }

  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleUserStatus(@Param('id') id: string) {
    return this.usersService.toggleUserStatus(id);
  }
}
