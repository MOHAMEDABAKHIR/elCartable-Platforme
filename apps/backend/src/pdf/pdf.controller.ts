import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PdfService } from './pdf.service';

@ApiTags('Orders')
@Controller('orders/:id/pdf')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMMERCIAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get()
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Générer et télécharger la fiche de commande PDF (+ QR de suivi)' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { order, pdf } = await this.pdfService.getOrderPdf(id, user.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${order.orderNumber}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }
}
