export interface IStorageMethod {
  setFilename(value: string): void;

  uploadFile(file: any): Promise<string>;

  readFile(fileName: string): Promise<string>;

  deleteFile(fileName: string);
}
