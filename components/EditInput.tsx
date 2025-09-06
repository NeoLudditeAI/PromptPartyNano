// components/EditInput.tsx
// Edit input component for ≤25-character edit commands

import React, { useState, useRef } from 'react';
import { validateEditCommand } from '../lib/feature-detection';

interface EditInputProps {
  onSubmit: (editCommand: string, referenceImage?: File) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const EditInput: React.FC<EditInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Enter edit command (≤25 chars)...",
  maxLength = 25,
  className = ''
}) => {
  const [editCommand, setEditCommand] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (value: string) => {
    setEditCommand(value);
    
    // Validate in real-time
    const validationResult = validateEditCommand(value);
    setValidation(validationResult);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid || editCommand.trim().length === 0) {
      return;
    }
    
    onSubmit(editCommand.trim(), referenceImage || undefined);
    setEditCommand('');
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setReferenceImage(file);
    }
  };
  
  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const getInputBorderColor = () => {
    if (validation.errors.length > 0) return 'border-red-300 focus:border-red-500';
    if (validation.warnings.length > 0) return 'border-yellow-300 focus:border-yellow-500';
    return 'border-gray-300 focus:border-blue-500';
  };
  
  const getCharacterCountColor = () => {
    const remaining = maxLength - editCommand.length;
    if (remaining < 0) return 'text-red-500';
    if (remaining < 5) return 'text-yellow-500';
    return 'text-gray-500';
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main input */}
        <div className="relative">
          <input
            type="text"
            value={editCommand}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={`
              w-full px-4 py-3 pr-20
              border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-colors duration-200
              ${getInputBorderColor()}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
          
          {/* Character counter */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className={`text-sm font-mono ${getCharacterCountColor()}`}>
              {editCommand.length}/{maxLength}
            </span>
          </div>
        </div>
        
        {/* Validation messages */}
        {validation.errors.length > 0 && (
          <div className="text-red-600 text-sm space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}
        
        {validation.warnings.length > 0 && (
          <div className="text-yellow-600 text-sm space-y-1">
            {validation.warnings.map((warning, index) => (
              <div key={index}>• {warning}</div>
            ))}
          </div>
        )}
        
        {/* Reference image upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reference Image (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {referenceImage && (
              <button
                type="button"
                onClick={removeReferenceImage}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>
          
          {referenceImage && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span>✓</span>
              <span>{referenceImage.name}</span>
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={disabled || !validation.isValid || editCommand.trim().length === 0}
          className={`
            w-full py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${disabled || !validation.isValid || editCommand.trim().length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            }
          `}
        >
          {disabled ? 'Processing...' : 'Submit Edit'}
        </button>
      </form>
      
      {/* Help text */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>💡 <strong>Tips:</strong></div>
        <div>• Use short commands like "add hat", "change color", "remove background"</div>
        <div>• Attach a reference image for style transfer</div>
        <div>• Be specific but concise</div>
      </div>
    </div>
  );
};
