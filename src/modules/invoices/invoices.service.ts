import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        order: {
          include: {
            customer: true,
            shippingAddress: true,
            billingAddress: true,
            items: true,
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice '${invoiceNumber}' not found`);

    return invoice;
  }

  async getInvoicesForOrder(orderId: string) {
    return this.prisma.invoice.findMany({
      where: { orderId },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
