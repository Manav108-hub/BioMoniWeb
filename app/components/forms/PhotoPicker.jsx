"use client";

import React, { useState } from 'react';

const PhotoPicker = ({ onPhotoSelect }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
        onPhotoSelect(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-2">Upload Photo</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
      />
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          className="mt-2 max-h-40 w-auto"
        />
      )}
    </div>
  );
};

export default PhotoPicker;