import {printCibilReport} from "./pdfGeneration2";

export const printPdf = (data = {}) => {
    const html = printCibilReport(data); // ✅ অন্য function call

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 2000);
};
