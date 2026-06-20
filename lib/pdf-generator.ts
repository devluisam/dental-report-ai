import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const DPI = 96;
const MM_PER_INCH = 25.4;

function mmToPx(mm: number) {
  return (mm / MM_PER_INCH) * DPI;
}

async function captureElement(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    onclone: (doc) => {
      // Ensure recharts SVGs render correctly
      const svgs = doc.querySelectorAll("svg");
      svgs.forEach((svg) => {
        if (!svg.getAttribute("xmlns")) {
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }
      });
    },
  });
}

export async function generatePDF(containerRef: HTMLDivElement): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pages = containerRef.querySelectorAll<HTMLElement>(".report-page");

  if (pages.length === 0) {
    throw new Error("Nenhuma página encontrada para gerar o PDF");
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    const canvas = await captureElement(page, 2);
    const imgData = canvas.toDataURL("image/png", 0.95);

    if (i > 0) pdf.addPage();

    const canvasAspect = canvas.width / canvas.height;
    const a4Aspect = A4_WIDTH_MM / A4_HEIGHT_MM;

    let imgW = A4_WIDTH_MM;
    let imgH = A4_HEIGHT_MM;

    if (canvasAspect > a4Aspect) {
      imgH = A4_WIDTH_MM / canvasAspect;
    } else {
      imgW = A4_HEIGHT_MM * canvasAspect;
    }

    const xOffset = (A4_WIDTH_MM - imgW) / 2;
    const yOffset = (A4_HEIGHT_MM - imgH) / 2;

    pdf.addImage(imgData, "PNG", xOffset, yOffset, imgW, imgH);
  }

  pdf.save("relatorio-estagio-odontologico.pdf");
}
