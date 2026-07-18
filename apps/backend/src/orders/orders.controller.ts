import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { AssignCommercialDto } from './dto/assign-commercial.dto';
import { SearchOrderDto } from './dto/search-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';

const STAFF_ROLES = [UserRole.COMMERCIAL, UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commande (public, sans compte)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Post('track')
  @ApiOperation({ summary: 'Suivi public — numéro de commande + téléphone client' })
  track(@Body() dto: TrackOrderDto) {
    return this.ordersService.track(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste filtrable des commandes (Commercial/Admin/SuperAdmin)' })
  findAll(@Query() query: SearchOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Détail d'une commande (Commercial/Admin/SuperAdmin)" })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier client / adresse / note (Commercial/Admin/SuperAdmin)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le statut — timeline (Commercial/Admin/SuperAdmin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assigner un commercial à la commande (Commercial/Admin/SuperAdmin)' })
  assignCommercial(
    @Param('id') id: string,
    @Body() dto: AssignCommercialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.assignCommercial(id, dto, user.id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un article à la commande (Commercial/Admin/SuperAdmin)' })
  addItem(
    @Param('id') id: string,
    @Body() dto: CreateOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.addItem(id, dto, user.id);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Modifier la quantité d'un article (Commercial/Admin/SuperAdmin)" })
  updateItemQuantity(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateItemQuantity(id, itemId, dto, user.id);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retirer un article de la commande (Commercial/Admin/SuperAdmin)" })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.removeItem(id, itemId, user.id);
  }
}
