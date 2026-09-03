import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateProductSchema,
  UpdateProductDto,
  UpdateProductSchema,
  GetProductsQueryDto,
  GetProductsQuerySchema,
} from './dto/product.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Public Catalog Listing:
   * Supports filtering by Category, Gender, Brand, Price range, Electronics Type, and Sorting.
   * Size is strictly excluded from catalog filters.
   */
  @Public()
  @Get()
  async findAll(@Query(new ZodValidationPipe(GetProductsQuerySchema)) query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  /**
   * Admin paginated product list
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.productsService.getAdminProducts(pageNum, limitNum, search);
  }

  /**
   * Public Product Details Page (PDP):
   * Provides full variant list with sizes and real-time stock for size selection pills.
   */
  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  /**
   * Admin Create Product:
   * Validates variant attributes against category rules (zero extra fields allowed).
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(CreateProductSchema)) dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * Admin Update Product
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) dto: UpdateProductDto
  ) {
    return this.productsService.update(id, dto);
  }

  /**
   * Admin Delete Product
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
