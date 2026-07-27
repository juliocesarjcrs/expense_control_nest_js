export interface IStorageMethod {
  setFilename(value: string): void;
  uploadFile(file: Express.Multer.File): Promise<string>;
  readFile(fileName: string): Promise<string>;
  deleteFile(fileName: string): Promise<void>;
}
