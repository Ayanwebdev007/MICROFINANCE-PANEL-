const { getFirestore } = require('firebase-admin/firestore');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const db = getFirestore();

// Define a professional color palette and layout constants (Retained from your input)
const COLORS = {
    PRIMARY: rgb(0.04, 0.2, 0.45), // Deep Navy Blue for headers
    SECONDARY: rgb(0.1, 0.1, 0.1),  // Near Black for main text
    LABEL_TEXT: rgb(0.3, 0.3, 0.3), // Darker gray for label text
    BORDER: rgb(0.75, 0.75, 0.75),  // Light gray border color
    WHITE: rgb(1, 1, 1),
    LIGHT_BG: rgb(0.98, 0.98, 0.98),
};

const LAYOUT = {
    PAGE_WIDTH: 595.28,
    PAGE_HEIGHT: 841.89, // A4
    MARGIN: 30,
    LINE_HEIGHT: 11,
    SECTION_SPACING: 10,
    FIELD_HEIGHT: 18,
    FIELD_ROW_SPACE: 23,
    HEADER_HEIGHT: 35,
    FOOTER_HEIGHT: 30,
    SECTION_TITLE_HEIGHT: 20,
};

module.exports = app => {
    // This endpoint now generates an empty KYC form template,
    // using memberId only for the header display.
    app.post('/api/member/print-kyc-form', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const { memberId, bankId } = req.body;

        if (!memberId) {
            return res.status(400).send({ error: 'Member ID is required for header display.' });
        }

        try {
            const actualBankId = bankId || token.bankId;

            // --- 1. Fetch Bank Data Only ---
            const bankRef = db.collection(actualBankId).doc('admin').collection('bank-info').doc('details');
            const bankDoc = await bankRef.get();
            const bankData = bankDoc.exists ? bankDoc.data() : {};

            // --- 2. Generate PDF Template ---
            const pdfBytes = await generateKYCTemplate(memberId, bankData);

            // --- 3. Send Response ---
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="KYC_Form_Template_${memberId}.pdf"`);
            res.setHeader('Content-Length', pdfBytes.length);

            res.send(Buffer.from(pdfBytes));

        } catch (error) {
            console.error('Error generating KYC PDF Template:', error);
            res.status(500).send({ error: 'Failed to generate PDF template. Please try again.' });
        }
    });
};


// --- Core PDF Generation Function for Blank Template ---
async function generateKYCTemplate(memberId, bankData = {}) {
    // --- Initialize PDF ---
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT]);
    let yPosition = LAYOUT.PAGE_HEIGHT - LAYOUT.MARGIN;

    const contentWidth = LAYOUT.PAGE_WIDTH - 2 * LAYOUT.MARGIN;
    const contentStart = LAYOUT.MARGIN;

    // --- Helper Functions (defined locally for context access) ---

    const drawText = (text, x, y, options = {}) => {
        const targetPage = options.page || page;
        targetPage.drawText(String(text || ''), {
            x, y,
            size: options.size || 9,
            font: options.bold ? boldFont : font,
            color: options.color || COLORS.SECONDARY,
            ...options
        });
    };

    const drawRect = (x, y, w, h, options = {}) => {
        page.drawRectangle({
            x, y, width: w, height: h,
            color: options.fillColor || undefined,
            borderColor: options.borderColor || undefined,
            borderWidth: options.borderWidth || 0,
            ...options
        });
    };

    const drawHeader = () => {
        // Header background
        drawRect(0, LAYOUT.PAGE_HEIGHT - LAYOUT.HEADER_HEIGHT, LAYOUT.PAGE_WIDTH, LAYOUT.HEADER_HEIGHT, {
            fillColor: COLORS.PRIMARY,
        });

        const bankName = (bankData.bankName || bankData.displayName || 'NATIONAL BANK').toUpperCase();

        // Use the passed memberId for the KYC ID
        const kycId = `MEMBER ID: ${memberId}`;

        // Bank name (centered)
        drawText(bankName, LAYOUT.PAGE_WIDTH / 2, LAYOUT.PAGE_HEIGHT - 22, {
            bold: true, size: 10, color: COLORS.WHITE,
            x: LAYOUT.PAGE_WIDTH / 2 - (boldFont.widthOfTextAtSize(bankName, 10) / 2)
        });

        // KYC ID (right side)
        const kycIdWidth = font.widthOfTextAtSize(kycId, 8);
        drawRect(LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - kycIdWidth - 20, LAYOUT.PAGE_HEIGHT - 27, kycIdWidth + 20, 16, {
            fillColor: COLORS.WHITE,
            borderRadius: 3
        });
        drawText(kycId, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - kycIdWidth - 10, LAYOUT.PAGE_HEIGHT - 21, {
            size: 8, color: COLORS.PRIMARY, bold: true
        });
    };

    const checkPageBreak = (requiredSpace, currentY) => {
        const minFooterY = LAYOUT.MARGIN + LAYOUT.FOOTER_HEIGHT;

        if (currentY - requiredSpace < minFooterY) {
            page = pdfDoc.addPage([LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT]);
            drawHeader();
            return LAYOUT.PAGE_HEIGHT - LAYOUT.MARGIN - LAYOUT.HEADER_HEIGHT - LAYOUT.SECTION_SPACING;
        }
        return currentY;
    };

    const drawSectionHeader = (number, title, y) => {
        const headerY = y - LAYOUT.SECTION_TITLE_HEIGHT;
        drawRect(contentStart, headerY, contentWidth, LAYOUT.SECTION_TITLE_HEIGHT, {
            fillColor: COLORS.PRIMARY,
        });
        drawRect(contentStart + 2, headerY + 4, 12, 12, { fillColor: COLORS.WHITE });
        drawText(String(number), contentStart + 5, headerY + 6, { size: 9, color: COLORS.PRIMARY, bold: true });
        drawText(`${title}`, contentStart + 20, headerY + 5, {
            bold: true, size: 9, color: COLORS.WHITE,
        });
        return headerY - LAYOUT.SECTION_SPACING / 2;
    };

    // --- UPDATED drawCharacterBoxes for label placement fix ---
    const drawCharacterBoxes = (label, value, x, y, w, charCount) => {
        // y is the top reference point for this element (yPosition from caller)

        // 1. Label Positioning (Baseline 5 points down from top anchor y)
        const labelBaselineY = y - 5;

        // 2. Box Positioning (Box top 8 points below the label baseline, creating a gap)
        const boxTopY = labelBaselineY - 10;
        const boxBottomY = boxTopY - LAYOUT.FIELD_HEIGHT;
        const boxHeight = LAYOUT.FIELD_HEIGHT;
        const charBoxWidth = w / charCount;

        // Draw Label
        drawText(label, x, labelBaselineY, { size: 8, color: COLORS.LABEL_TEXT });

        // Draw Boxes
        const displayValue = String(value || '').replace(/\s/g, '').toUpperCase().slice(0, charCount);

        for (let i = 0; i < charCount; i++) {
            const boxX = x + i * charBoxWidth;

            // Draw Rect starting from the bottom-left corner
            drawRect(boxX, boxBottomY, charBoxWidth, boxHeight, {
                borderColor: COLORS.BORDER,
                borderWidth: 0.8,
                fillColor: COLORS.WHITE
            });

            if (i < displayValue.length) {
                const char = displayValue[i];
                const charWidth = boldFont.widthOfTextAtSize(char, 9);
                // Draw character centered in the box, 4 points up from the bottom for centering
                drawText(char, boxX + (charBoxWidth / 2) - (charWidth / 2), boxBottomY + 4, {
                    size: 9, color: COLORS.SECONDARY, bold: true
                });
            }
        }

        // Return the y position for the *next* element (below the box).
        return boxBottomY - (LAYOUT.SECTION_SPACING / 4);
    };

    const drawTwoColumnBoxes = (L1, V1, C1, L2, V2, C2, currentY) => {
        const gutter = 15;
        const fieldWidth = (contentWidth - gutter) / 2;
        const rightColumnX = contentStart + fieldWidth + gutter;

        // Pass currentY (top reference)
        const newLeftY = drawCharacterBoxes(L1, V1, contentStart, currentY, fieldWidth, C1);
        const newRightY = L2 ? drawCharacterBoxes(L2, V2, rightColumnX, currentY, fieldWidth, C2) : newLeftY;

        return Math.min(newLeftY, newRightY);
    };

    // --- 3. Draw Content ---

    drawHeader();
    yPosition -= LAYOUT.HEADER_HEIGHT;

    // Form Title (Updated to "KNOW YOUR MEMBER KYC")
    yPosition -= 5;
    drawRect(contentStart, yPosition - 25, contentWidth, 25, { fillColor: COLORS.LIGHT_BG });
    drawText('KNOW YOUR MEMBER KYC', contentWidth / 2 + contentStart, yPosition - 12, {
        bold: true, size: 11, color: COLORS.PRIMARY,
        x: contentWidth / 2 + contentStart - (boldFont.widthOfTextAtSize('KNOW YOUR MEMBER KYC', 11) / 2)
    });
    drawText('For Individuals (Please fill in BLOCK LETTERS)', contentWidth / 2 + contentStart, yPosition - 22, {
        size: 7, color: COLORS.LABEL_TEXT,
        x: contentWidth / 2 + contentStart - (font.widthOfTextAtSize('For Individuals (Please fill in BLOCK LETTERS)', 7) / 2)
    });
    yPosition -= 35;

    // --- BLANK DATA STRUCTURES (Fields will be empty) ---

    // ============ 1. Personal Details ============
    const personalInfoData = [
        ['KYC No', '', 14, 'Marital Status', '', 15],
        ['Full Name', '', 30, 'Email', '', 30],
        ['Father/Mother/Spouse', '', 30, 'Phone Number', '', 15],
        ['Date of Birth (DDMMYYYY)', '', 8, 'Qualification', '', 15],
        ['Nationality', '', 15, 'Gender', '', 10],
    ];

    const requiredSpace = LAYOUT.SECTION_TITLE_HEIGHT + (personalInfoData.length * LAYOUT.FIELD_ROW_SPACE) + LAYOUT.SECTION_SPACING;
    yPosition = checkPageBreak(requiredSpace, yPosition);
    yPosition = drawSectionHeader(1, 'Personal Details', yPosition);

    for (const [L1, V1, C1, L2, V2, C2] of personalInfoData) {
        yPosition = checkPageBreak(LAYOUT.FIELD_ROW_SPACE, yPosition);
        yPosition = drawTwoColumnBoxes(L1, V1, C1, L2, V2, C2, yPosition);
    }
    yPosition -= LAYOUT.SECTION_SPACING;

    // ============ 2. IDENTIFICATION DOCUMENTS ============
    const idDocData = [
        ['Aadhar Number', '', 12, 'PAN Number', '', 10],
        ['Voter ID', '', 15, 'Driving License No', '', 20],
        ['Passport Number', '', 15, '', '', 0],
    ];

    const idDocSpace = LAYOUT.SECTION_TITLE_HEIGHT + (idDocData.length * LAYOUT.FIELD_ROW_SPACE) + LAYOUT.SECTION_SPACING;
    yPosition = checkPageBreak(idDocSpace, yPosition);
    yPosition = drawSectionHeader(2, 'Identification Documents', yPosition);

    for (const [L1, V1, C1, L2, V2, C2] of idDocData) {
        if (L2) {
            yPosition = checkPageBreak(LAYOUT.FIELD_ROW_SPACE, yPosition);
            yPosition = drawTwoColumnBoxes(L1, V1, C1, L2, V2, C2, yPosition);
        } else {
            yPosition = checkPageBreak(LAYOUT.FIELD_ROW_SPACE, yPosition);
            // Draw single column box
            yPosition = drawCharacterBoxes(L1, V1, contentStart, yPosition, contentWidth / 2, C1);
        }
    }
    yPosition -= LAYOUT.SECTION_SPACING;

    // ============ 3. ADDRESS DETAILS ============
    yPosition = checkPageBreak(LAYOUT.SECTION_TITLE_HEIGHT + 60, yPosition);
    yPosition = drawSectionHeader(3, 'Residential Address', yPosition);

    drawText('Complete Address:', contentStart, yPosition, { size: 8, color: COLORS.LABEL_TEXT });
    yPosition -= 14;

    const addressBoxH = LAYOUT.FIELD_HEIGHT * 2 + 10;
    drawRect(contentStart, yPosition - addressBoxH, contentWidth, addressBoxH, {
        borderColor: COLORS.BORDER,
        borderWidth: 0.8,
        fillColor: COLORS.WHITE
    });
    // Draw blank space for address
    yPosition -= addressBoxH + LAYOUT.SECTION_SPACING;

    // ============ 4. NOMINEE INFORMATION ============
    const nomineeData = [
        ['Nominee Name', '', 30, 'Nominee Aadhar', '', 12],
        ['Relation to Applicant', '', 15, 'Nominee PAN', '', 10],
        ['Nominee DOB (DDMMYYYY)', '', 8, 'Nominee Phone', '', 10],
    ];

    const nomineeSpace = LAYOUT.SECTION_TITLE_HEIGHT + (nomineeData.length * LAYOUT.FIELD_ROW_SPACE) + LAYOUT.SECTION_SPACING;
    yPosition = checkPageBreak(nomineeSpace, yPosition);
    yPosition = drawSectionHeader(4, 'Nominee Details', yPosition);

    for (const [L1, V1, C1, L2, V2, C2] of nomineeData) {
        yPosition = checkPageBreak(LAYOUT.FIELD_ROW_SPACE, yPosition);
        yPosition = drawTwoColumnBoxes(L1, V1, C1, L2, V2, C2, yPosition);
    }
    yPosition -= LAYOUT.SECTION_SPACING;

    // ============ 5. ACCOUNT DETAILS ============
    const accountData = [
        ['Account Type', '', 15, 'Branch Code', '', 10],
        ['CBO Name', '', 20, 'IFSC Code', '', 11],
        ['Occupation', '', 15, 'Monthly Income', '', 10],
    ];

    const accountSpace = LAYOUT.SECTION_TITLE_HEIGHT + (accountData.length * LAYOUT.FIELD_ROW_SPACE) + LAYOUT.SECTION_SPACING;
    yPosition = checkPageBreak(accountSpace, yPosition);
    yPosition = drawSectionHeader(5, 'Account & Professional Details', yPosition);

    for (const [L1, V1, C1, L2, V2, C2] of accountData) {
        yPosition = checkPageBreak(LAYOUT.FIELD_ROW_SPACE, yPosition);
        yPosition = drawTwoColumnBoxes(L1, V1, C1, L2, V2, C2, yPosition);
    }
    yPosition -= LAYOUT.SECTION_SPACING;

    // ============ 6. DECLARATION ============
    const declarationSpace = LAYOUT.SECTION_TITLE_HEIGHT + 80;
    yPosition = checkPageBreak(declarationSpace, yPosition);
    yPosition = drawSectionHeader(6, 'Declaration', yPosition);

    yPosition -= 5;
    drawRect(contentStart, yPosition - 70, contentWidth, 70, {
        fillColor: COLORS.LIGHT_BG,
        borderColor: COLORS.BORDER,
        borderWidth: 0.5
    });

    const declarationText = 'I/We hereby declare that the details furnished above are true and correct to the best of my/our knowledge and belief and I/We undertake to inform you of any changes therein, immediately. In case any of the above information is found to be false or untrue or misleading, I am/We are aware that I/We may be held liable for it. I/We hereby consent to receiving information from the Bank through telephone calls, SMS, emails for the Bank\'s products and services.';

    let declarationY = yPosition - 10;
    const words = declarationText.split(' ');
    let currentLine = '';
    const maxWidth = contentWidth - 20;

    for (const word of words) {
        const testLine = currentLine + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, 7.5);

        if (textWidth > maxWidth && currentLine !== '') {
            drawText(currentLine.trim(), contentStart + 10, declarationY, { size: 7.5 });
            declarationY -= 9;
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine.trim() !== '') {
        drawText(currentLine.trim(), contentStart + 10, declarationY, { size: 7.5 });
    }

    yPosition -= 80;

    // ============ 7. SIGNATURE & PHOTO SECTION ============
    const signatureSpace = LAYOUT.SECTION_TITLE_HEIGHT + 150;
    yPosition = checkPageBreak(signatureSpace, yPosition);
    yPosition = drawSectionHeader(7, 'Signature & Photo', yPosition);

    yPosition -= 10;
    const boxY = yPosition - 110;

    // Photo box
    const photoX = contentStart + 10;
    drawRect(photoX, boxY, 100, 110, {
        borderColor: COLORS.BORDER,
        borderWidth: 1,
        fillColor: COLORS.WHITE
    });
    drawText('PHOTOGRAPH', photoX + 20, boxY + 50, {
        size: 8, color: COLORS.LABEL_TEXT, bold: true
    });

    // Applicant Signature
    const signX = photoX + 130;
    drawRect(signX, boxY, 140, 40, {
        borderColor: COLORS.BORDER,
        borderWidth: 1,
        fillColor: COLORS.WHITE
    });
    drawText('Signature of Applicant', signX + 5, boxY - 10, {
        size: 8, color: COLORS.LABEL_TEXT
    });
    drawText('Date: _______________', signX + 5, boxY - 20, {
        size: 7, color: COLORS.LABEL_TEXT
    });

    // Bank Official Signature
    const officialX = signX + 160;
    drawRect(officialX, boxY, 140, 40, {
        borderColor: COLORS.BORDER,
        borderWidth: 1,
        fillColor: COLORS.WHITE
    });
    drawText('Verified By', officialX + 5, boxY - 10, {
        size: 8, color: COLORS.LABEL_TEXT, bold: true
    });
    drawText('Bank Official', officialX + 5, boxY - 20, {
        size: 7, color: COLORS.LABEL_TEXT
    });
    drawText('Date: _______________', officialX + 5, boxY - 30, {
        size: 7, color: COLORS.LABEL_TEXT
    });

    yPosition = boxY - 30;

    // ============ 8. BRANCH MANAGER APPROVAL ============
    const finalApprovalSpace = 80;
    yPosition = checkPageBreak(finalApprovalSpace, yPosition);

    yPosition -= 10;
    drawRect(contentStart, yPosition - 60, contentWidth, 60, {
        fillColor: COLORS.LIGHT_BG,
        borderColor: COLORS.BORDER,
        borderWidth: 1
    });

    drawText('FOR BANK USE ONLY - BRANCH MANAGER APPROVAL', contentStart + 10, yPosition - 15, {
        bold: true, size: 9, color: COLORS.PRIMARY
    });

    const managerSignX = contentStart + contentWidth - 200;
    drawRect(managerSignX, yPosition - 55, 180, 35, {
        borderColor: COLORS.BORDER,
        borderWidth: 0.8,
        fillColor: COLORS.WHITE
    });
    drawText('Approved By (Branch Manager)', managerSignX + 5, yPosition - 25, {
        size: 7, color: COLORS.LABEL_TEXT
    });
    drawText('Signature & Stamp', managerSignX + 5, yPosition - 40, {
        size: 7, color: COLORS.LABEL_TEXT
    });
    drawText('Date: _______________', managerSignX + 5, yPosition - 50, {
        size: 7, color: COLORS.LABEL_TEXT
    });


    // ============ FOOTER (Dynamic Drawing) ============
    const tempPdfBytes = await pdfDoc.save();
    const finalizedPdfDoc = await PDFDocument.load(tempPdfBytes);
    const pages = finalizedPdfDoc.getPages();
    // Re-embed fonts for the finalized document
    const finalFont = await finalizedPdfDoc.embedFont(StandardFonts.Helvetica);
    const finalBoldFont = await finalizedPdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < pages.length; i++) {
        const currentPage = pages[i];
        const pageNumber = i + 1;
        const totalPages = pages.length;
        const footerY = LAYOUT.MARGIN + 5;

        // Separator line
        currentPage.drawLine({
            start: { x: LAYOUT.MARGIN, y: footerY + 15 },
            end: { x: LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN, y: footerY + 15 },
            thickness: 0.5,
            color: COLORS.BORDER,
        });

        // Page number (center)
        const pageText = `Page ${pageNumber} of ${totalPages}`;
        const pageX = LAYOUT.PAGE_WIDTH / 2 - (finalFont.widthOfTextAtSize(pageText, 7) / 2);
        currentPage.drawText(pageText, {
            x: pageX, y: footerY, size: 7, font: finalBoldFont, color: COLORS.LABEL_TEXT
        });

        // Document ID (left)
        const docId = `Member ID: ${memberId}`;
        currentPage.drawText(docId, {
            x: LAYOUT.MARGIN, y: footerY, size: 7, font: finalFont, color: COLORS.LABEL_TEXT
        });

        // Date (right)
        const generatedDate = `Generated: ${new Date().toLocaleDateString('en-IN')}`;
        const dateX = LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN - finalFont.widthOfTextAtSize(generatedDate, 7);
        currentPage.drawText(generatedDate, {
            x: dateX, y: footerY, size: 7, font: finalFont, color: COLORS.LABEL_TEXT
        });
    }

    return await finalizedPdfDoc.save();
}