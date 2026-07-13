declare module "heic-convert" {
  type HeicConvertOptions = {
    buffer: ArrayBuffer | Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  export default function heicConvert(
    options: HeicConvertOptions
  ): Promise<ArrayBuffer>;
}

declare module "heic2any" {
  type Heic2AnyOptions = {
    blob: Blob;
    toType?: string;
    quality?: number;
  };

  export default function heic2any(
    options: Heic2AnyOptions
  ): Promise<Blob | Blob[]>;
}
