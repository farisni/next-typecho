export type StoredImage = {
  url: string;
  key: string;
  size: number;
  mimeType: string;
};

export interface ImageStorage {
  save(file: File): Promise<StoredImage>;
}
