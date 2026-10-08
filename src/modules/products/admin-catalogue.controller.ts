import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AdminCatalogueService } from './admin-catalogue.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from '../../common/guards/auth.guard';
import { Roles, RequirePermissions, CurrentUser } from '../../common/decorators/auth.decorator';
import { UserRole, JwtPayload } from '../../common/types/roles';

const productImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${baseName}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateProductFieldDto,
  UpdateProductFieldDto,
  CreateFieldOptionDto,
  UpdateFieldOptionDto,
  CreateProductImageDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  RecordStockMovementDto,
} from './dto/catalogue.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_MANAGER, UserRole.SALES_OFFICE, UserRole.PRODUCTION_OPERATOR, UserRole.ACCOUNTS)
export class AdminCatalogueController {
  constructor(private readonly catalogueService: AdminCatalogueService) {}

  // ==========================================
  // CATEGORIES
  // ==========================================

  @Get('catalogue/categories')
  async listCategories() {
    return this.catalogueService.listCategories();
  }

  @Get('catalogue/categories/:id')
  async getCategoryById(@Param('id') id: string) {
    return this.catalogueService.getCategoryById(id);
  }

  @Post('catalogue/categories')
  @Roles(UserRole.ADMIN_MANAGER)
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.createCategory(dto, user?.sub);
  }

  @Put('catalogue/categories/:id')
  @Roles(UserRole.ADMIN_MANAGER)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.updateCategory(id, dto, user?.sub);
  }

  @Delete('catalogue/categories/:id')
  @Roles(UserRole.ADMIN_MANAGER)
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.deleteCategory(id, user?.sub);
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  @Get('catalogue/products')
  async listProducts(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogueService.listProducts({
      categoryId,
      status,
      search,
      page,
      limit,
    });
  }

  @Get('catalogue/products/:id')
  async getProductById(@Param('id') id: string) {
    return this.catalogueService.getProductById(id);
  }

  @Post('catalogue/products')
  @Roles(UserRole.ADMIN_MANAGER)
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.createProduct(dto, user?.sub);
  }

  @Put('catalogue/products/:id')
  @Roles(UserRole.ADMIN_MANAGER)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.updateProduct(id, dto, user?.sub);
  }

  @Post('catalogue/products/:id/duplicate')
  @Roles(UserRole.ADMIN_MANAGER)
  async duplicateProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.duplicateProduct(id, user?.sub);
  }

  @Patch('catalogue/products/:id/publish')
  @Roles(UserRole.ADMIN_MANAGER)
  async publishProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.publishProduct(id, user?.sub);
  }

  @Patch('catalogue/products/:id/archive')
  @Roles(UserRole.ADMIN_MANAGER)
  async archiveProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.archiveProduct(id, user?.sub);
  }

  @Delete('catalogue/products/:id')
  @Roles(UserRole.ADMIN_MANAGER)
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.deleteProduct(id, user?.sub);
  }

  // ==========================================
  // DYNAMIC FIELDS
  // ==========================================

  @Post('catalogue/products/:productId/fields')
  @Roles(UserRole.ADMIN_MANAGER)
  async addField(
    @Param('productId') productId: string,
    @Body() dto: CreateProductFieldDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.addField(productId, dto, user?.sub);
  }

  @Put('catalogue/products/:productId/fields/:fieldId')
  @Roles(UserRole.ADMIN_MANAGER)
  async updateField(
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateProductFieldDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.updateField(fieldId, dto, user?.sub);
  }

  @Delete('catalogue/products/:productId/fields/:fieldId')
  @Roles(UserRole.ADMIN_MANAGER)
  async deleteField(
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.deleteField(fieldId, user?.sub);
  }

  @Post('catalogue/products/:productId/fields/:fieldId/options')
  @Roles(UserRole.ADMIN_MANAGER)
  async addFieldOption(
    @Param('fieldId') fieldId: string,
    @Body() dto: CreateFieldOptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.addFieldOption(fieldId, dto, user?.sub);
  }

  @Put('catalogue/products/:productId/fields/:fieldId/options/:optionId')
  @Roles(UserRole.ADMIN_MANAGER)
  async updateFieldOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateFieldOptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.updateFieldOption(optionId, dto, user?.sub);
  }

  @Delete('catalogue/products/:productId/fields/:fieldId/options/:optionId')
  @Roles(UserRole.ADMIN_MANAGER)
  async deleteFieldOption(
    @Param('optionId') optionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.deleteFieldOption(optionId, user?.sub);
  }

  // ==========================================
  // PRODUCT IMAGES & UPLOADS
  // ==========================================

  @Post('catalogue/products/:productId/upload-image')
  @Roles(UserRole.ADMIN_MANAGER)
  @UseInterceptors(FileInterceptor('file', { storage: productImageStorage }))
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
    @Body('caption') caption?: string,
    @Body('isPrimary') isPrimary?: string | boolean,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const isPrimaryBool = isPrimary === 'true' || isPrimary === true;
    return this.catalogueService.uploadProductImage(
      productId,
      file,
      { altText, caption, isPrimary: isPrimaryBool },
      user?.sub,
    );
  }

  @Post('catalogue/upload-media')
  @Roles(UserRole.ADMIN_MANAGER)
  @UseInterceptors(FileInterceptor('file', { storage: productImageStorage }))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const relativeUrl = `/uploads/products/${file.filename}`;
    return {
      url: relativeUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('catalogue/products/:productId/images')
  @Roles(UserRole.ADMIN_MANAGER)
  async addProductImage(
    @Param('productId') productId: string,
    @Body() dto: CreateProductImageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.addProductImage(productId, dto, user?.sub);
  }

  @Patch('catalogue/products/:productId/images/:imageId/primary')
  @Roles(UserRole.ADMIN_MANAGER)
  async setPrimaryImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.setPrimaryImage(productId, imageId, user?.sub);
  }

  @Delete('catalogue/products/:productId/images/:imageId')
  @Roles(UserRole.ADMIN_MANAGER)
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.deleteProductImage(productId, imageId, user?.sub);
  }

  @Patch('catalogue/products/:productId/images/reorder')
  @Roles(UserRole.ADMIN_MANAGER)
  async reorderImages(
    @Param('productId') productId: string,
    @Body('orderedImageIds') orderedImageIds: string[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.reorderImages(productId, orderedImageIds, user?.sub);
  }

  // ==========================================
  // INVENTORY & RAW MATERIALS
  // ==========================================

  @Get('inventory/items')
  async listInventoryItems(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: boolean,
  ) {
    return this.catalogueService.listInventoryItems({
      category,
      search,
      lowStockOnly: Boolean(lowStockOnly),
    });
  }

  @Post('inventory/items')
  @Roles(UserRole.ADMIN_MANAGER, UserRole.PRODUCTION_OPERATOR)
  async createInventoryItem(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.createInventoryItem(dto, user?.sub);
  }

  @Put('inventory/items/:id')
  @Roles(UserRole.ADMIN_MANAGER, UserRole.PRODUCTION_OPERATOR)
  async updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.updateInventoryItem(id, dto, user?.sub);
  }

  @Post('inventory/items/:id/movement')
  @Roles(UserRole.ADMIN_MANAGER, UserRole.PRODUCTION_OPERATOR)
  async recordStockMovement(
    @Param('id') id: string,
    @Body() dto: RecordStockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.catalogueService.recordStockMovement(id, dto, user?.sub);
  }

  @Get('inventory/movements')
  async listStockMovements(@Query('itemId') itemId?: string) {
    return this.catalogueService.listStockMovements(itemId);
  }
}
