declare module "tesseract.js" {
  export function createWorker(
    lang?: string,
    oem?: number,
    options?: {
      logger?: (message: unknown) => void;
      langPath?: string;
    }
  ): Promise<{
    recognize(image: string): Promise<{ data: { text?: string } }>;
    terminate(): Promise<void>;
  }>;
}
