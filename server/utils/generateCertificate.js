const {
    PDFDocument,
    StandardFonts,
    rgb
} = require('pdf-lib');

/**
 * Generates a participation certificate PDF.
 * @param {{ participantName: string, eventName: string, eventDate: string|Date }} params
 * @returns {Promise<Uint8Array>}
 */
async function generateCertificate({
    participantName,
    eventName,
    eventDate
}) {
    const pdfDoc = await PDFDocument.create();

    // Landscape A4: width=842, height=595 points
    const page = pdfDoc.addPage([842, 595]);
    const {
        width,
        height
    } = page.getSize();

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Format date
    const date = new Date(eventDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    // Decorative border rectangle (inset ~20pt from edges)
    const borderInset = 20;
    page.drawRectangle({
        x: borderInset,
        y: borderInset,
        width: width - borderInset * 2,
        height: height - borderInset * 2,
        borderColor: rgb(0.4, 0.2, 0.6),
        borderWidth: 3,
    });

    // Inner border for decoration
    page.drawRectangle({
        x: borderInset + 6,
        y: borderInset + 6,
        width: width - (borderInset + 6) * 2,
        height: height - (borderInset + 6) * 2,
        borderColor: rgb(0.6, 0.4, 0.8),
        borderWidth: 1,
    });

    // Helper to center text horizontally
    const centerText = (text, font, size, y) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y,
            size,
            font,
            color: rgb(0.1, 0.1, 0.1),
        });
    };

    // Title: "Certificate of Participation"
    centerText('Certificate of Participation', boldFont, 32, height - 100);

    // Decorative line under title
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
        color: rgb(0.4, 0.2, 0.6),
    });

    // "This is to certify that"
    centerText('This is to certify that', regularFont, 16, height - 165);

    // Participant name (large, bold)
    centerText(participantName, boldFont, 28, height - 215);

    // Underline for participant name
    const nameWidth = boldFont.widthOfTextAtSize(participantName, 28);
    page.drawLine({
        start: {
            x: (width - nameWidth) / 2,
            y: height - 220
        },
        end: {
            x: (width + nameWidth) / 2,
            y: height - 220
        },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3),
    });

    // "has successfully participated in"
    centerText('has successfully participated in', regularFont, 16, height - 265);

    // Event name (medium, bold)
    centerText(eventName, boldFont, 22, height - 305);

    // "held on " + formatted date
    centerText('held on ' + formattedDate, regularFont, 16, height - 355);

    return pdfDoc.save();
}

module.exports = {
    generateCertificate
};