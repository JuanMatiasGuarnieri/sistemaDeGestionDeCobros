import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          throw new Error('El archivo no contiene datos');
        }

        const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

        const normalizedData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            const value = row[index];

            if (header.includes('numero') || header.includes('factura') || header.includes('nro')) {
              obj.numero = String(value || '');
            } else if (header.includes('cliente') || header.includes('nombre') || header.includes('razón')) {
              obj.cliente = String(value || '');
            } else if (header.includes('direccion') || header.includes('dirección') || header.includes('domicilio')) {
              obj.direccion = String(value || '');
            } else if (header.includes('monto') || header.includes('importe') || header.includes('total') || header.includes('valor')) {
              if (typeof value === 'number') {
                obj.monto = value;
              } else if (typeof value === 'string') {
                const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                obj.monto = parseFloat(cleaned) || 0;
              } else {
                obj.monto = 0;
              }
            } else if (header.includes('fecha') || header.includes('fec')) {
              if (value instanceof Date) {
                obj.fecha = value.toISOString().split('T')[0];
              } else {
                obj.fecha = String(value || '');
              }
            }
          });
          return obj;
        }).filter(row => row.numero || row.cliente);

        resolve(normalizedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data, filename, sheetName = 'Datos') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const colWidths = [];
  if (data.length > 0) {
    Object.keys(data[0]).forEach(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
  }
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportFacturasReport(facturas, cobros, filename) {
  const data = facturas.map(factura => {
    const cobro = cobros.find(c => c.facturaId === factura.id);
    return {
      'Número': factura.numero,
      'Cliente': factura.cliente?.nombre || '',
      'Dirección': factura.direccion || '',
      'Monto': factura.monto,
      'Fecha Emisión': factura.fechaEmision,
      'Fecha Vencimiento': factura.fechaVencimiento,
      'Estado': factura.estado === 'cobrada' ? 'Cobrada' : factura.estado === 'vencida' ? 'Vencida' : 'Pendiente',
      'Fecha Cobro': cobro?.fechaCobro || '-',
      'Monto Cobrado': cobro?.montoCobrado || '-',
    };
  });

  exportToExcel(data, filename, 'Facturas');
}