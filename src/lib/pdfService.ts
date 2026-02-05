import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Standard UI dimensions
const UI_WIDTH = 612;
const UI_HEIGHT = 792;

export async function embedSignature(
    pdfBytes: Uint8Array,
    signatureDataUrl: string,
    position: { x: number; y: number; width: number; height: number; page: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    console.log(`EmbedSignature: Total pages ${pages.length}, Target page ${position.page}`);

    // Validate page
    if (position.page < 1 || position.page > pages.length) {
        console.error(`Invalid page number ${position.page}. Defaulting to 1.`);
        position.page = 1;
    }

    const page = pages[position.page - 1];

    // Get actual PDF page dimensions
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Convert data URL to bytes
    const signatureBytes = dataUrlToBytes(signatureDataUrl);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Scale factor: UI uses 612px width. PDF is scaled uniformly to fit width.
    // So we use width ratio for both X and Y scaling.
    const scaleX = pageWidth / UI_WIDTH;
    const scaleY = scaleX; // Uniform scaling

    const pdfX = position.x * scaleX;
    const pdfY = pageHeight - (position.y * scaleY) - (position.height * scaleY);
    const pdfWidth = position.width * scaleX;
    const pdfHeight = position.height * scaleY;

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
    position: { x: number; y: number; width?: number; height?: number; page: number; fontSize?: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    console.log(`AddTextField: Total pages ${pages.length}, Target page ${position.page}`);

    if (position.page < 1 || position.page > pages.length) {
        position.page = 1;
    }

    const page = pages[position.page - 1];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const scaleX = pageWidth / UI_WIDTH;
    const scaleY = scaleX; // Uniform scaling

    const pdfX = position.x * scaleX;
    // Align text in middle of height if provided, else just offset
    const heightOffset = position.height ? (position.height * scaleY * 0.7) : 10;
    const padding = 8 * scaleX; // Match UI px-2 (8px)
    const pdfY = pageHeight - (position.y * scaleY) - heightOffset;

    page.drawText(text, {
        x: pdfX + padding,
        y: pdfY,
        size: (position.fontSize || 12) * scaleX,
        font,
        color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
}

export async function addDateField(
    pdfBytes: Uint8Array,
    date: Date | string,
    position: { x: number; y: number; width?: number; height?: number; page: number; format?: string }
): Promise<Uint8Array> {
    let formattedDate: string;
    if (typeof date === 'string') {
        const d = new Date(date);
        formattedDate = formatDate(d, position.format);
    } else {
        formattedDate = formatDate(date, position.format);
    }
    return addTextField(pdfBytes, formattedDate, position);
}

export async function addCheckboxField(
    pdfBytes: Uint8Array,
    checked: boolean,
    position: { x: number; y: number; width?: number; height?: number; page: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[position.page - 1];

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const scaleX = pageWidth / UI_WIDTH;
    const scaleY = scaleX; // Uniform scaling

    const boxSize = 12 * scaleX;
    const fieldHeight = position.height ? position.height * scaleY : boxSize;
    const fieldWidth = position.width ? position.width * scaleX : boxSize;

    // Center checkbox in the field box
    const pdfX = position.x * scaleX + (fieldWidth - boxSize) / 2;
    const pdfY = pageHeight - (position.y * scaleY) - (fieldHeight / 2) - (boxSize / 2);

    page.drawRectangle({
        x: pdfX,
        y: pdfY,
        width: boxSize,
        height: boxSize,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    if (checked) {
        const font = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
        page.drawText('4', {
            x: pdfX + 2,
            y: pdfY + 2,
            size: boxSize - 4,
            font,
            color: rgb(0, 0.5, 0),
        });
    }

    return await pdfDoc.save();
}

export async function addImageField(
    pdfBytes: Uint8Array,
    imageDataUrl: string,
    position: { x: number; y: number; width: number; height: number; page: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[position.page - 1];

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const scaleX = pageWidth / UI_WIDTH;
    const scaleY = scaleX; // Uniform scaling

    const pdfX = position.x * scaleX;
    const pdfY = pageHeight - (position.y * scaleY) - (position.height * scaleY);
    const pdfWidth = position.width * scaleX;
    const pdfHeight = position.height * scaleY;

    const imageBytes = dataUrlToBytes(imageDataUrl);
    let image;
    if (imageDataUrl.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        image = await pdfDoc.embedJpg(imageBytes);
    }

    page.drawImage(image, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
    });

    return await pdfDoc.save();
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

