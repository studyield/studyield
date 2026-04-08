declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    Title: string;
    Author: string;
    Subject: string;
    Keywords: string;
    Creator: string;
    Producer: string;
    CreationDate: string;
    ModDate: string;
  }
  interface PDFMetadata {
    _metadata: unknown;
  }
  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }
  function pdfParse(dataBuffer: Buffer, options?: unknown): Promise<PDFData>;
  export = pdfParse;
}
