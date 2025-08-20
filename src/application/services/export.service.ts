import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

import type {
  RentalRepositoryPort,
  UserRepositoryPort,
  CarRepositoryPort,
} from '../../application/ports/out/car-rental-out.ports';
import { RentalStatus } from '../../domain/enums/rental-status.enum';

function formatDate(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

@Injectable()
export class ExportService {
  constructor(
    @Inject('RentalRepositoryPort') private readonly rentals: RentalRepositoryPort,
    @Inject('UserRepositoryPort')   private readonly users: UserRepositoryPort,
    @Inject('CarRepositoryPort')    private readonly cars: CarRepositoryPort,
  ) {}

  async exportRental(
    rentalId: string,
    format: 'pdf' | 'xlsx' = 'pdf',
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    const rental = await this.rentals.findById(rentalId);
    if (!rental) throw new NotFoundException('Rental not found');

    const user = await this.users.findById(rental.userId);
    if (!user) throw new NotFoundException('User not found');

    const car = await this.cars.findById(rental.carId);
    if (!car) throw new NotFoundException('Car not found');

    if (format === 'xlsx') {
      const buffer = await this.buildExcel({ rental, user, car });
      return {
        filename: `rental-${rental.id}.xlsx`,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer,
      };
    }

    const buffer = await this.buildPdf({ rental, user, car });
    return { filename: `rental-${rental.id}.pdf`, mime: 'application/pdf', buffer };
  }

  private async buildPdf({ rental, user, car }: any): Promise<Buffer> {
    const doc = new (PDFDocument as any)({ margin: 48 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Car Rental Summary', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'right' });
      doc.moveDown();

      // Reservation
      doc.fontSize(14).text('Reservation', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Reservation Code: ${rental.reservationCode ?? '-'}`)
        .text(`Rental ID       : ${rental.id}`)
        .text(`Status          : ${rental.status ?? RentalStatus.ACTIVE}`)
        .text(`Start           : ${formatDate(rental.startDate)}`)
        .text(`End             : ${formatDate(rental.endDate)}`)
        .text(`Total Price     : ${rental.totalPrice}`);
      doc.moveDown();

      // Car
      doc.fontSize(14).text('Car', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Car ID     : ${car.id}`)
        .text(`Brand/Model: ${car.brand} ${car.model}`)
        .text(`Daily Price: ${car.dailyPrice}`)
        .text(`Status     : ${car.status}`);
      doc.moveDown();

      // User
      doc.fontSize(14).text('User', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`User ID        : ${user.id}`)
        .text(`Full Name      : ${user.fullName}`)
        .text(`Email          : ${user.email}`)
        .text(`Driver License : ${user.driverLicenseNo}`)
        .text(`Roles          : ${(user.roles ?? []).join(', ') || '-'}`);

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#999')
        .text('© Car Rental Demo — Hexagonal Architecture', { align: 'center' });

      doc.end();
    });
  }

  private async buildExcel({ rental, user, car }: any): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CarRental';
    wb.created = new Date();

    const ws = wb.addWorksheet('Summary');
    ws.columns = [
      { header: 'Field', key: 'field', width: 24 },
      { header: 'Value', key: 'value', width: 48 },
    ];

    const addRow = (field: string, value: any) => ws.addRow({ field, value });

    ws.addRow(['Section', 'Reservation']);
    addRow('Reservation Code', rental.reservationCode ?? '-');
    addRow('Rental ID', rental.id);
    addRow('Status', rental.status ?? RentalStatus.ACTIVE);
    addRow('Start', formatDate(rental.startDate));
    addRow('End', formatDate(rental.endDate));
    addRow('Total Price', rental.totalPrice);
    ws.addRow([]);

    ws.addRow(['Section', 'Car']);
    addRow('Car ID', car.id);
    addRow('Brand/Model', `${car.brand} ${car.model}`);
    addRow('Daily Price', car.dailyPrice);
    addRow('Status', car.status);
    ws.addRow([]);

    ws.addRow(['Section', 'User']);
    addRow('User ID', user.id);
    addRow('Full Name', user.fullName);
    addRow('Email', user.email);
    addRow('Driver License', user.driverLicenseNo);
    addRow('Roles', (user.roles ?? []).join(', ') || '-');

    ws.getRow(1).font = { bold: true };
    ws.eachRow((row, idx) => {
      if ([1, 9, 14].includes(idx)) row.font = { bold: true };
    });
    ws.getColumn('field').font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
