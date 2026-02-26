import fs from 'fs';
import path from 'path';
import { uploadService } from '../upload.service';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('UploadService', () => {
  describe('getImageUrl', () => {
    it('should return /uploads/{filename}', () => {
      expect(uploadService.getImageUrl('abc123.jpg')).toBe('/uploads/abc123.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should call fs.unlinkSync with the full path', () => {
      mockFs.existsSync.mockReturnValue(true);
      uploadService.deleteFile('/full/path/to/file.jpg');
      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/full/path/to/file.jpg');
    });

    it('should not throw if file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(() => uploadService.deleteFile('/nonexistent.jpg')).not.toThrow();
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getAbsolutePath', () => {
    it('should resolve filename to absolute path in upload dir', () => {
      const result = uploadService.getAbsolutePath('abc123.jpg');
      expect(result).toBe(path.resolve('uploads', 'abc123.jpg'));
    });
  });

  describe('filenameFromUrl', () => {
    it('should extract filename from /uploads/filename', () => {
      expect(uploadService.filenameFromUrl('/uploads/abc123.jpg')).toBe('abc123.jpg');
    });

    it('should return null for non-upload URLs', () => {
      expect(uploadService.filenameFromUrl('https://cdn.example.com/img.jpg')).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      expect(uploadService.filenameFromUrl(null)).toBeNull();
      expect(uploadService.filenameFromUrl(undefined)).toBeNull();
    });
  });
});
