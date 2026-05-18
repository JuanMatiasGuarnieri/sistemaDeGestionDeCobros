const OCR_API_KEY = 'helloworld';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

export async function processTableOCR(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('isTable', 'true');
  formData.append('language', 'Spanish');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  try {
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: {
        'apikey': OCR_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error en la solicitud OCR');
    }

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage[0] || 'Error procesando imagen');
    }

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      throw new Error('No se encontró texto en la imagen');
    }

    const text = data.ParsedResults[0].ParsedText;
    return parseOCRText(text);
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

function parseOCRText(text) {
  const lines = text.split('\n').filter(line => line.trim());

  const data = [];
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (i === 0) {
      headers = line.split(/\t|,|;|\|/).map(h => h.trim().toLowerCase());
      continue;
    }

    const values = line.split(/\t|,|;|\|/).map(v => v.trim());

    if (values.length >= 2) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return normalizeData(data);
}

function normalizeData(data) {
  return data.map(row => {
    const normalized = {};

    Object.keys(row).forEach(key => {
      const cleanKey = key.toLowerCase().replace(/[^a-záéíóúñ]/g, '');

      if (cleanKey.includes('numero') || cleanKey.includes('factura') || cleanKey.includes('nro')) {
        normalized.numero = row[key];
      } else if (cleanKey.includes('cliente') || cleanKey.includes('nombre') || cleanKey.includes('razón')) {
        normalized.cliente = row[key];
      } else if (cleanKey.includes('direccion') || cleanKey.includes('dirección') || cleanKey.includes('domicilio')) {
        normalized.direccion = row[key];
      } else if (cleanKey.includes('monto') || cleanKey.includes('importe') || cleanKey.includes('total') || cleanKey.includes('importe')) {
        const value = row[key].replace(/[^0-9.,]/g, '').replace(',', '.');
        normalized.monto = parseFloat(value) || 0;
      } else if (cleanKey.includes('fecha') || cleanKey.includes('fec')) {
        normalized.fecha = row[key];
      }
    });

    return normalized;
  }).filter(row => row.numero || row.cliente);
}