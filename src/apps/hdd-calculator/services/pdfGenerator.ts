import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (elementId: string, fileName: string = 'hdd-report.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Keep reasonable resolution
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
                // Find elements that should not be sticky in PDF (like the header)
                const stickyElements = clonedDoc.querySelectorAll('.pdf-hide-sticky');
                stickyElements.forEach((el) => {
                    // Force static positioning for the capture
                    (el as HTMLElement).style.position = 'static';
                    (el as HTMLElement).style.boxShadow = 'none'; // Optional: remove shadow for print look
                    // If we want it only on the first page, static place it at the top. 
                    // Since it's usually at the top of the 'element' being captured, 'static' is fine.
                });

                // Fix potential cutting of text in appendix boxes by ensuring details are visible
                // Can add specific print refinements here if needed
            }
        });

        // Use JPEG instead of PNG to drastically reduce file size
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Subsequent pages
        while (heightLeft > 0) {
            position -= pdfHeight; // Move image up by one page height
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(fileName);
        /* 
           Actually, the simplest reliable way for variable length content is proper paging, 
           but stripping 'position' logic down to the basics:
        */
    } catch (error) {
        console.error('PDF Generation Failed:', error);
        alert('Không thể tạo file PDF. Vui lòng thử lại.');
    }
};
