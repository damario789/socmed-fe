"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatio = '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

interface AspectRatioOption {
  label: string;
  value: AspectRatio;
  aspectRatio: number;
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { label: 'Square (1:1)', value: '1:1', aspectRatio: 1 / 1 },
  { label: 'Landscape (4:3)', value: '4:3', aspectRatio: 4 / 3 },
  { label: 'Widescreen (16:9)', value: '16:9', aspectRatio: 16 / 9 },
  { label: 'Portrait (3:4)', value: '3:4', aspectRatio: 3 / 4 },
  { label: 'Portrait (9:16)', value: '9:16', aspectRatio: 9 / 16 },
];

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE_MB = 5; // 5MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'crop' | 'preview'>('select');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>(ASPECT_RATIO_OPTIONS[0]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select');
        setSelectedImage(null);
        setCroppedImage(null);
        setCaption('');
        setFileError(null);
        setApiError(null);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { 
        valid: false, 
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` 
      };
    }
    
    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_FORMATS.includes(extension)) {
      return { 
        valid: false, 
        error: `File format not supported. Allowed formats: ${ALLOWED_FORMATS.join(', ')}` 
      };
    }
    
    return { valid: true };
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate the file
      const validation = validateFile(file);
      
      if (!validation.valid) {
        setFileError(validation.error ?? null);
        return;
      }
      
      setFileError(null);
      const reader = new FileReader();
      
      reader.onload = () => {
        // Make sure we have a string result
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
          setStep('crop');
        }
      };
      
      reader.readAsDataURL(file);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;

    // Center crop with the selected aspect ratio
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        selectedRatio.aspectRatio,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
    setCompletedCrop(convertToPixelCrop(crop, width, height));
  }

  function convertToPixelCrop(crop: Crop, width: number, height: number): PixelCrop {
    return {
      unit: 'px',
      x: Math.round(crop.x! * width / 100),
      y: Math.round(crop.y! * height / 100),
      width: Math.round(crop.width! * width / 100),
      height: Math.round(crop.height! * height / 100)
    };
  }

  function changeAspectRatio(option: AspectRatioOption) {
    setSelectedRatio(option);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      
      // Center crop with the new aspect ratio
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          option.aspectRatio,
          width,
          height
        ),
        width,
        height
      );
      
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  }

  // More reliable way to create a cropped image
  function createCroppedImage(sourceImage: HTMLImageElement, pixelCrop: PixelCrop): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No 2d context');
        }

        // Set the canvas size to the crop dimensions
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        
        // Calculate the scaling factors
        const scaleX = sourceImage.naturalWidth / sourceImage.width;
        const scaleY = sourceImage.naturalHeight / sourceImage.height;
        
        // Draw the cropped image to the canvas
        ctx.drawImage(
          sourceImage,
          pixelCrop.x * scaleX,
          pixelCrop.y * scaleY,
          pixelCrop.width * scaleX,
          pixelCrop.height * scaleY,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        
        // Convert to data URL and resolve
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (e) {
        reject(e);
      }
    });
  }

  async function handleContinue() {
    if (step === 'crop' && completedCrop && imgRef.current) {
      try {
        setIsSubmitting(true);
        // Wait for the cropped image to be created
        const cropped = await createCroppedImage(imgRef.current, completedCrop);
        setCroppedImage(cropped);
        setStep('preview');
      } catch (e) {
        console.error('Error cropping image:', e);
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 'preview') {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step === 'crop') {
      setSelectedImage(null);
      setStep('select');
    } else if (step === 'preview') {
      setStep('crop');
    }
  }

  async function handleSubmit() {
    if (!croppedImage) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Convert dataURL to blob for upload
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      formData.append('caption', caption);

      // Get token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to create a post');
      }

      // Send the request to the API
      const apiResponse = await fetch('http://localhost:3000/feeds/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      const result = await apiResponse.json();
      console.log('Post created successfully:', result);
      
      // Close modal on success and refresh feed
      onClose();
      
      // If we want to refresh the feed after posting, we could call a callback here
      // e.g., onPostCreated(result.post);
      
    } catch (error) {
      console.error('Error creating post:', error);
      setApiError(error instanceof Error ? error.message : 'An error occurred while creating the post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Semi-transparent backdrop that doesn't hide the background completely */}
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="flex items-center justify-center h-full p-4">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden relative z-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 'select'}
              className={`font-medium ${
                step === 'select' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Back
            </button>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {step === 'select' ? 'Create New Post' : step === 'crop' ? 'Crop Image' : 'Preview Post'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'select' && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop a photo, or click to select
                </p>
                
                {/* File type and size info */}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Allowed formats: {ALLOWED_FORMATS.join(', ')} (Max {MAX_FILE_SIZE_MB}MB)
                </p>
                
                {fileError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {fileError}
                  </p>
                )}
                
                <label className="mt-4">
                  <input
                    type="file"
                    accept={ALLOWED_FORMATS.map(format => `.${format}`).join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer text-sm">
                    Select Photo
                  </span>
                </label>
              </div>
            )}

            {step === 'crop' && selectedImage && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={selectedRatio.aspectRatio}
                    className="max-h-[400px]"
                  >
                    <img
                      src={selectedImage}
                      alt="Upload preview"
                      onLoad={onImageLoad}
                      ref={imgRef}
                      className="max-h-[400px] max-w-full"
                    />
                  </ReactCrop>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => changeAspectRatio(option)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        selectedRatio.value === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'preview' && croppedImage && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {/* Debug information to help understand what's happening */}
                  {!croppedImage.startsWith('data:image') && (
                    <div className="text-red-500 mb-2 text-center">
                      Invalid image data: {croppedImage.substring(0, 20)}...
                    </div>
                  )}
                  <img
                    src={croppedImage}
                    alt="Preview"
                    className="max-h-[300px] rounded"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Write a caption..."
                  ></textarea>
                </div>
                
                {apiError && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm rounded">
                    {apiError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            {step !== 'select' && (
              <button
                onClick={handleContinue}
                disabled={isSubmitting || (step === 'crop' && !completedCrop)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  isSubmitting || (step === 'crop' && !completedCrop)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {step === 'preview' ? 'Posting...' : 'Processing...'}
                  </span>
                ) : step === 'crop' ? (
                  'Continue'
                ) : (
                  'Share'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}