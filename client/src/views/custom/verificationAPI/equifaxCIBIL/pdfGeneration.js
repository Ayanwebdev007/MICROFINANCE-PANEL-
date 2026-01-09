export const printWithBrowserAPI = () => {
    const element = document.getElementById('civil-score-card');
    const printContent = element.cloneNode(true);

    // Remove the print button from cloned content
    const printButton = printContent.querySelector('.text-center.mt-4');
    if (printButton) printButton.remove();

    // Ensure all table content is preserved
    const originalTables = element.querySelectorAll('table');
    const clonedTables = printContent.querySelectorAll('table');

    // Copy table content explicitly to avoid cloning issues
    originalTables.forEach((originalTable, index) => {
        if (clonedTables[index]) {
            clonedTables[index].innerHTML = originalTable.innerHTML;
        }
    });

    const printWindow = window.open();

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CIBIL Report</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
        }
        
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          body { 
            background: white !important; 
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: 12px !important;
          }
          
          .card {
            border: 1px solid #dee2e6 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 10px !important;
          }
          
          .bg-info {
            background-color: #17a2b8 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .bg-primary {
            background-color: #007bff !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .table-light {
            background-color: #f8f9fa !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .table-striped tbody tr:nth-of-type(odd) {
            background-color: rgba(0,0,0,.05) !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .text-white {
            color: white !important;
          }
          
          .border-light {
            border-color: #f8f9fa !important;
          }
          
          .table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 15px !important;
            font-size: 10px !important;
          }
          
          .table th, .table td {
            padding: 6px !important;
            border: 1px solid #dee2e6 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .table-responsive-sm {
            overflow-x: visible !important;
          }
          
          .card-body {
            padding: 15px !important;
          }
          
          .row {
            margin: 0 !important;
          }
          
          .col-md-6, .col-12 {
            padding: 2px !important;
            font-size: 11px !important;
          }
          
          h4, h5, h6 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }
          
          .fs-5 {
            font-size: 16px !important;
          }
          
          img {
            max-width: 100px !important;
            height: auto !important;
          }
        }
        
        @media screen {
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 20px;
            background: white;
            color: black;
          }
          
          .card {
            border: 1px solid #dee2e6;
            border-radius: 16px;
            margin-bottom: 20px;
          }
          
          .table {
            margin-bottom: 0;
            width: 100%;
          }
          
          .table th, .table td {
            padding: 8px;
            border: 1px solid #dee2e6;
            word-wrap: break-word;
          }
          
          .table-responsive-sm {
            overflow-x: auto;
          }
        }
        
        /* Ensure tables don't break */
        .table {
          table-layout: fixed;
          width: 100%;
        }
        
        .table td, .table th {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Make sure all content is visible */
        .d-none, .d-print-none {
          display: none !important;
        }
        
        .d-print-block {
          display: block !important;
        }
        
        .d-print-table {
          display: table !important;
        }
      </style>
    </head>
    <body>
      <div class="container-fluid">
        ${printContent.outerHTML}
      </div>
      <script>
        // Wait for content and styles to load
        window.onload = function() {
          // Ensure all images are loaded
          const images = document.querySelectorAll('img');
          const imagePromises = Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            });
          });
          
          Promise.all(imagePromises).then(() => {
            setTimeout(() => {
              window.print();
              // Don't close immediately, let user handle it
              // window.close();
            }, 1000);
          });
        };
        
        // Handle print dialog close
        window.addEventListener('afterprint', function() {
          setTimeout(() => {
            window.close();
          }, 500);
        });
      </script>
    </body>
    </html>
  `);

    printWindow.document.close();
};