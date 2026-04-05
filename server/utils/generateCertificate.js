const {
    PDFDocument,
    StandardFonts,
    rgb
} = require('pdf-lib');

/**
 * Overlays participant name on an uploaded PDF template.
 * Falls back to a built-in design if no template is provided.
 *
 * @param {{
 *   participantName: string,
 *   eventName: string,
 *   eventDate: string|Date,
 *   templateBase64?: string,   // base64-encoded PDF template
 *   nameX?: number,            // x position for name (pdf-lib coords from bottom-left)
 *   nameY?: number,            // y position for name
 *   fontSize?: number
 * }} params
 * @returns {Promise<Uint8Array>}
 */
async function generateCertificate({
    participantName,
    eventName,
    eventDate,
    templateBase64,
    nameX,
    nameY,
    fontSize
}) {
    const date = new Date(eventDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // ── Template mode ──────────────────────────────────────────────────────────
    if (templateBase64) {
        const templateBytes = Buffer.from(templateBase64, 'base64');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const page = pages[0];
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const x = nameX != null ? Number(nameX) : page.getWidth() / 2 - boldFont.widthOfTextAtSize(participantName, fontSize || 28) / 2;
        const y = nameY != null ? Number(nameY) : page.getHeight() / 2;
        const size = fontSize ? Number(fontSize) : 28;

        page.drawText(participantName, {
            x,
            y,
            size,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
        });

        return pdfDoc.save();
    }

    // ── Built-in fallback design ───────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const {
        width,
        height
    } = page.getSize();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const borderInset = 20;
    page.drawRectangle({
        x: borderInset,
        y: borderInset,
        width: width - borderInset * 2,
        height: height - borderInset * 2,
        borderColor: rgb(0.4, 0.2, 0.6),
        borderWidth: 3
    });
    page.drawRectangle({
        x: borderInset + 6,
        y: borderInset + 6,
        width: width - (borderInset + 6) * 2,
        height: height - (borderInset + 6) * 2,
        borderColor: rgb(0.6, 0.4, 0.8),
        borderWidth: 1
    });

    const centerText = (text, font, size, y) => {
        const tw = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
            x: (width - tw) / 2,
            y,
            size,
            font,
            color: rgb(0.1, 0.1, 0.1)
        });
    };

    centerText('Certificate of Participation', boldFont, 32, height - 100);
    page.drawLine({
        start: {
            x: 100,
            y: height - 115
        },
        end: {
            x: width - 100,
            y: height - 115
        },
        thickness: 1.5,
        color: rgb(0.4, 0.2, 0.6)
    });
    centerText('This is to certify that', regularFont, 16, height - 165);
    centerText(participantName, boldFont, 28, height - 215);
    const nw = boldFont.widthOfTextAtSize(participantName, 28);
    page.drawLine({
        start: {
            x: (width - nw) / 2,
            y: height - 220
        },
        end: {
            x: (width + nw) / 2,
            y: height - 220
        },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3)
    });
    centerText('has successfully participated in', regularFont, 16, height - 265);
    centerText(eventName, boldFont, 22, height - 305);
    centerText('held on ' + formattedDate, regularFont, 16, height - 355);

    return pdfDoc.save();
}

module.exports = {
    generateCertificate
};