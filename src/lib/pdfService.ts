import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function embedSignature(
    pdfBytes: Uint8Array,
    signatureDataUrl: string,
    position: { x: number; y: number; width: number; height: number; page: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[position.page - 1];

    // Get actual PDF page dimensions
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    console.log('PDF Page dimensions:', { width: pageWidth, height: pageHeight });
    console.log('UI position:', position);

    // Convert data URL to bytes
    const signatureBytes = dataUrlToBytes(signatureDataUrl);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Calculate PDF coordinates (PDF origin is bottom-left, UI origin is top-left)
    // Scale factor: UI uses 612px width, PDF might be different
    const scaleX = pageWidth / 612;
    const scaleY = pageHeight / 792;

    const pdfX = position.x * scaleX;
    const pdfY = pageHeight - (position.y * scaleY) - (position.height * scaleY);
    const pdfWidth = position.width * scaleX;
    const pdfHeight = position.height * scaleY;

    console.log('Scale factors:', { scaleX, scaleY });
    console.log('Calculated PDF coordinates:', { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight });

    page.drawImage(signatureImage, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
    });

    return await pdfDoc.save();
}

export async function addTextField(
    pdfBytes: Uint8Array,
    text: string,
    position: { x: number; y: number; page: number; fontSize?: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[position.page - 1];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(text, {
        x: position.x,
        y: page.getHeight() - position.y,
        size: position.fontSize || 12,
        font,
        color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
}

export async function addDateField(
    pdfBytes: Uint8Array,
    date: Date,
    position: { x: number; y: number; page: number; format?: string }
): Promise<Uint8Array> {
    const formattedDate = formatDate(date, position.format);
    return addTextField(pdfBytes, formattedDate, position);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function formatDate(date: Date, format?: string): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
}

export async function getPdfPageCount(pdfBytes: Uint8Array): Promise<number> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
}
