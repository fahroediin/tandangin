'use server';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function embedSignature(
    pdfBytes: Uint8Array,
    signatureDataUrl: string,
    position: { x: number; y: number; width: number; height: number; page: number }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[position.page - 1];

    // Convert data URL to bytes
    const signatureBytes = dataUrlToBytes(signatureDataUrl);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    page.drawImage(signatureImage, {
        x: position.x,
        y: page.getHeight() - position.y - position.height,
        width: position.width,
        height: position.height,
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
