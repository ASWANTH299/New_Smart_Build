import React, { useRef, useState } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { Button } from "./Button.js";
import { cn } from "../../utils/cn.js";

export interface FileUploaderProps {
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = "Upload Document or Attachment",
  helperText = "PDF, DOCX, XLSX, PNG, or JPG up to 10MB",
  accept = ".pdf,.docx,.xlsx,.png,.jpg,.jpeg",
  maxSizeMB = 10,
  onFilesSelected,
  className,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).filter((file) => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxSizeMB;
    });

    setSelectedFiles((prev) => [...prev, ...fileArray]);
    if (onFilesSelected) {
      onFilesSelected(fileArray);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (onFilesSelected) onFilesSelected(updated);
      return updated;
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</label>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-white",
          isDragging ? "border-brand-500 bg-brand-50/40" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="p-2.5 bg-slate-50 text-slate-500 rounded-full border border-slate-200/80 mb-2">
          <UploadCloud className="w-6 h-6 text-brand-600" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-800 text-center">
          <span className="text-brand-600 font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500 mt-1 text-center">{helperText}</p>
      </div>

      {selectedFiles.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {selectedFiles.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
            >
              <div className="flex items-center gap-2 truncate">
                <File className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(idx)}
                className="p-1 h-auto text-slate-400 hover:text-red-600"
                aria-label={`Remove file ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
