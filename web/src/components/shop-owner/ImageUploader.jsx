// ImageUploader.jsx
// Drag and drop image uploader component

import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function ImageUploader({ onUpload, currentImage, label = "Upload Image" }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onUpload(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const clearImage = () => {
    setPreview(null);
    onUpload(null, null);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-neutral-800"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            isDragging 
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
              : 'border-gray-300 dark:border-neutral-700 hover:border-amber-500'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-600 dark:text-gray-400">
              Drag & drop or click to upload
            </p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
          </label>
        </div>
      )}
    </div>
  );
}
