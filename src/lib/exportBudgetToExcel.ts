import ExcelJS from "exceljs";

export interface BudgetExportData {
  project: {
    title: string;
    description?: string;
    locations_schedule?: string;
    deliverables?: string;
    notes?: string;
  };
  client: { name: string; payment_terms?: string };
  items: Array<{
    sectionName: string;
    type: string;
    pricePerDay: number;
    quantity: number;
    days: number;
    prepDays: number;
    extras: number;
    rowTotal: number;
  }>;
  summary: {
    itemsTotal: number;
    insurance: number;
    productionFee: number;
    discount: number;
    grandTotal: number;
  };
}

export async function exportBudgetToExcel(data: BudgetExportData): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("תקציב");

  let row = 1;
  ws.getCell(`A${row}`).value = data.project.title;
  row++;
  ws.getCell(`A${row}`).value = `לקוח: ${data.client.name}`;
  row += 2;

  if (data.project.description) {
    ws.getCell(`A${row}`).value = "תיאור העבודה:";
    row++;
    ws.getCell(`A${row}`).value = data.project.description;
    row += 2;
  }
  if (data.project.locations_schedule) {
    ws.getCell(`A${row}`).value = "לוקיישנים ולוח זמנים:";
    row++;
    ws.getCell(`A${row}`).value = data.project.locations_schedule;
    row += 2;
  }
  if (data.project.deliverables) {
    ws.getCell(`A${row}`).value = "תוצרים:";
    row++;
    ws.getCell(`A${row}`).value = data.project.deliverables;
    row += 2;
  }
  if (data.project.notes) {
    ws.getCell(`A${row}`).value = "הערות:";
    row++;
    ws.getCell(`A${row}`).value = data.project.notes;
    row += 2;
  }

  row++;
  ws.getCell(`A${row}`).value = "סוג";
  ws.getCell(`B${row}`).value = "מחיר ליום";
  ws.getCell(`C${row}`).value = "כמות";
  ws.getCell(`D${row}`).value = "ימים";
  ws.getCell(`E${row}`).value = "ימי הכנות";
  ws.getCell(`F${row}`).value = "תוספות";
  ws.getCell(`G${row}`).value = "מחיר סופי";
  row++;

  for (const item of data.items) {
    ws.getCell(`A${row}`).value = item.sectionName ? `[${item.sectionName}] ${item.type}` : item.type;
    ws.getCell(`B${row}`).value = item.pricePerDay;
    ws.getCell(`C${row}`).value = item.quantity;
    ws.getCell(`D${row}`).value = item.days;
    ws.getCell(`E${row}`).value = item.prepDays;
    ws.getCell(`F${row}`).value = item.extras;
    ws.getCell(`G${row}`).value = item.rowTotal;
    row++;
  }

  row += 2;
  ws.getCell(`A${row}`).value = "סה״כ פריטים:";
  ws.getCell(`G${row}`).value = data.summary.itemsTotal;
  row++;
  ws.getCell(`A${row}`).value = "ביטוח:";
  ws.getCell(`G${row}`).value = data.summary.insurance;
  row++;
  ws.getCell(`A${row}`).value = "עמלת הפקה:";
  ws.getCell(`G${row}`).value = data.summary.productionFee;
  row++;
  ws.getCell(`A${row}`).value = "הנחה:";
  ws.getCell(`G${row}`).value = -data.summary.discount;
  row++;
  ws.getCell(`A${row}`).value = "סה״כ כללי:";
  ws.getCell(`G${row}`).value = data.summary.grandTotal;
  row++;

  if (data.client.payment_terms) {
    row += 2;
    ws.getCell(`A${row}`).value = "תנאי תשלום:";
    row++;
    ws.getCell(`A${row}`).value = data.client.payment_terms;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `תקציב-${String(data.project.title).replace(/[/\\?%*:|"<>]/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
