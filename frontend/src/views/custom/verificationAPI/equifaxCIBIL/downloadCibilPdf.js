// import html2pdf from "html2pdf.js";
//
// export const downloadCibilPdf = (element) => {
//     if (!element) {
//         console.error("PDF download failed: element not found");
//         return;
//     }
//
//     const options = {
//         margin: 10,
//         filename: "CIBIL_Report.pdf",
//         image: { type: "jpeg", quality: 0.98 },
//         html2canvas: { scale: 2, useCORS: true },
//         jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
//     };
//
//     html2pdf().set(options).from(element).save(); // 🔥 auto download
// };


//
// import html2pdf from "html2pdf.js";
// import {printCibilReport} from "./pdfGeneration2";
//
// const safe = (v, d = "-") =>
//     v !== undefined && v !== null && v !== "" ? v : d;
//
// export const downloadCibilPdf = (data) => {
//     if (!data || Object.keys(data).length === 0) {
//         console.error("PDF download failed: No data");
//         return;
//     }
//
//     const element = document.getElementById("cibil-pdf-content");
//     const wrapper = document.createElement("div");
//     wrapper.innerHTML = printCibilReport(data);
//
//     if (!element) {
//         console.error("PDF content not found");
//         return;
//     }
//
//     const options = {
//         margin: [10, 10, 10, 10],
//         filename: `CIBIL_Report_${safe(data.name, "User")}.pdf`,
//         image: { type: "jpeg", quality: 0.98 },
//         html2canvas: {
//             scale: 2,
//             useCORS: true
//         },
//         jsPDF: {
//             unit: "mm",
//             format: "a4",
//             orientation: "portrait"
//         }
//     };
//
//     html2pdf().from(element).set(options).save(); // ✅ Direct Download
// };


import html2pdf from "html2pdf.js";

import {printCibilReport} from "./pdfGeneration2";

const safe = (v, d = "-") =>
    v !== undefined && v !== null && v !== "" ? v : d;

export const downloadCibilPdf = (data) => {
    if (!data || Object.keys(data).length === 0) {
        console.error("PDF download failed: No data");
        return;
    }

    // 🔹 Temporary container
    const container = document.createElement("div");
    container.innerHTML = printCibilReport(data, safe);

    html2pdf()
        .from(container)
        .set({
            margin: 10,
            filename: `CIBIL_Report_${safe(data.name, "User")}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save(); // ✅ DIRECT DOWNLOAD
};
