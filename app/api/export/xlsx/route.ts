import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sources');
    if (rows && rows.length) {
      const keys = Object.keys(rows[0]);
      ws.columns = keys.map(k => ({ header: k, key: k }));
      rows.forEach((r: any) => ws.addRow(r));
      ws.getRow(1).font = { bold: true };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sources.xlsx"'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
