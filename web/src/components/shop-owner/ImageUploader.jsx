// ImageUploader.jsx
// Drag and drop image uploader component with Supabase Storage integration

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import supabase from "../../lib/supabase";
import { toast } from "sonner";
import { useShop } from "../../context/ShopContext";

export default function ImageUploader({ onUpload, currentImage, label = "Upload Image" }) {
  const { shopId } = useShop();
  const [preview, setPreview] = useState(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      if (!shopId) {
        toast.error("Shop ID is required for image upload");
        setPreview(null);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(data.path);

      onUpload(file, publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setPreview(null);
    } finally {
      setUploading(false);
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-neutral-800"
          />
          {uploading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                <p className="text-white text-sm">Uploading...</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
            >
              <X size={16} />
            </button>
          )}
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
            disabled={uploading}
          />
          <label htmlFor="image-upload" className={uploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
            {uploading ? (
              <>
                <Loader2 className="mx-auto mb-2 text-gray-400 animate-spin" size={32} />
                <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-gray-600 dark:text-gray-400">
                  Drag & drop or click to upload
                </p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
