import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';
import {
  PhotoIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import toast from 'react-hot-toast';

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Enter property description...',
  maxLength = 2000,
  allowImages = true,
  allowLinks = true,
  allowLists = true,
  readonly = false,
  error = '',
  className = '',
  height = '200px',
  theme = 'snow',
  toolbar = 'default'
}) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState(value);
  const [isUploading, setIsUploading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  // Custom toolbar configurations
  const toolbarConfigs = {
    minimal: [
      ['bold', 'italic'],
      ['link']
    ],
    basic: [
      ['bold', 'italic', 'underline'],
      ['link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ],
    default: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
    advanced: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: toolbarConfigs[toolbar] || toolbarConfigs.default,
      handlers: {
        image: allowImages ? () => handleImageUpload() : null,
        link: allowLinks ? handleLinkInsert : null
      }
    },
    clipboard: {
      matchVisual: false
    },
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true
    }
  }), [toolbar, allowImages, allowLinks]);

  // Quill formats
  const formats = useMemo(() => {
    const baseFormats = ['bold', 'italic', 'underline', 'strike'];
    const extendedFormats = [
      'header', 'blockquote', 'code-block',
      'list', 'bullet', 'indent',
      'link', 'clean'
    ];
    
    let formats = [...baseFormats];
    
    if (allowLists) {
      formats.push('list', 'bullet');
    }
    
    if (allowLinks) {
      formats.push('link');
    }
    
    if (allowImages) {
      formats.push('image');
    }
    
    if (toolbar === 'advanced') {
      formats.push(...extendedFormats, 'color', 'background', 'align', 'video');
    } else if (toolbar === 'default') {
      formats.push('header', 'blockquote', 'code-block');
    }
    
    return formats;
  }, [allowLists, allowLinks, allowImages, toolbar]);

  // Handle content change
  const handleChange = useCallback((content, delta, source, editor) => {
    const text = editor.getText();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characterCount = text.length;
    
    setContent(content);
    setWordCount(wordCount);
    setCharacterCount(characterCount);
    
    // Check length limits
    if (maxLength && characterCount > maxLength) {
      toast.error(`Content exceeds maximum length of ${maxLength} characters`);
      return;
    }
    
    onChange?.(content, { wordCount, characterCount, text });
  }, [onChange, maxLength]);

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!allowImages) return;
    
    fileInputRef.current?.click();
  }, [allowImages]);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Firebase Storage
      const uploadPath = `property-images/${currentUser.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, uploadPath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Insert image into editor
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        quill.insertEmbed(range?.index || 0, 'image', downloadURL);
        quill.setSelection(range?.index + 1);
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentUser]);

  // Handle link insertion
  const handleLinkInsert = useCallback(() => {
    if (!allowLinks) return;
    
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const range = quill.getSelection();
    if (range) {
      const url = window.prompt('Enter link URL:');
      if (url) {
        // Validate URL
        try {
          new URL(url);
          quill.formatText(range.index, range.length, 'link', url);
        } catch {
          toast.error('Please enter a valid URL');
        }
      }
    }
  }, [allowLinks]);

  // Update content when value prop changes
  useEffect(() => {
    if (value !== content) {
      setContent(value);
      // Update counters
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const text = quill.getText();
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        setCharacterCount(text.length);
      }
    }
  }, [value, content]);

  // Character count color based on usage
  const getCounterColor = () => {
    if (!maxLength) return 'text-gray-500';
    const usage = characterCount / maxLength;
    if (usage >= 0.9) return 'text-red-600';
    if (usage >= 0.7) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Main editor */}
      <div className="relative">
        <ReactQuill
          ref={quillRef}
          theme={theme}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readonly}
          modules={modules}
          formats={formats}
          style={{ height }}
          className={`
            ${error ? 'border-red-300' : 'border-gray-300'} 
            ${readonly ? 'opacity-60' : ''}
          `}
        />
        
        {/* Loading overlay for image uploads */}
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading image...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with counters and error */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          {/* Word count */}
          <span className="text-gray-500">
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          
          {/* Character count */}
          <span className={getCounterColor()}>
            {characterCount}{maxLength ? ` / ${maxLength}` : ''} character{characterCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {!readonly && (
        <div className="mt-1 text-xs text-gray-500">
          {allowImages && <span>• Images supported (max 5MB) </span>}
          {allowLinks && <span>• Links supported </span>}
          {allowLists && <span>• Lists supported </span>}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 