import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Check, Crop, Move, Monitor, Smartphone, RotateCcw, ZoomIn, ZoomOut, AlertCircle, Film, Play, Pause, Loader2 } from 'lucide-react';
import defaultFashionStudioImg from '../../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import defaultBeautyDiamondsImg from '../../assets/images/dior_lightbrown_beauty_diamonds_perfume_1788954970837.jpg';
import { isVideoUrl, LUXURY_VIDEO_PRESETS, LUXURY_IMAGE_PRESETS, uploadMediaToServer } from '../../lib/media';

interface MediaManagerProps {
  label?: string;
  imageUrl: string;
  crop?: ImageCropSettings;
  onImageChange: (url: string, adjustments?: ImageAdjustments) => void;
  required?: boolean;
}

export interface ImageCropSettings {
  zoom: number;
  panX: number;
  panY: number;
  focalX: number;
  focalY: number;
  aspectRatio: string;
  fit: string;
}

export interface ImageAdjustments {
  fit: 'cover' | 'contain' | 'fill';
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | 'custom';
  focalPoint: { x: number; y: number };
  crop?: ImageCropSettings;
}

export function MediaManager({ label = "Image Asset", imageUrl, crop, onImageChange, required = false }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Crop Modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  
  // Interactive Crop settings inside Modal (coordinates are in pixel offsets relative to centered baseWidth and baseHeight)
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(35);
  const [aspectRatio, setAspectRatio] = useState<string>('3:4');
  const [fit, setFit] = useState<string>('cover');

  // Track the natural aspect ratio of the active image
  const [imgAspectRatio, setImgAspectRatio] = useState<number>(1.0);

  // Preview tab in Modal
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // For dragging image underneath the crop frame
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const samplePresets = [
    ...LUXURY_VIDEO_PRESETS,
    ...LUXURY_IMAGE_PRESETS
  ];

  // Load and cache natural aspect ratio of the image, converting saved percentages to pixels
  useEffect(() => {
    if (tempImageUrl && !isVideoUrl(tempImageUrl)) {
      const img = new Image();
      img.src = tempImageUrl;
      img.onload = () => {
        if (img.width && img.height) {
          const ratio = img.width / img.height;
          setImgAspectRatio(ratio);

          const containerRatio = W_container / H_container;
          let baseWidth = W_container;
          let baseHeight = H_container;

          if (ratio > containerRatio) {
            baseHeight = H_container;
            baseWidth = H_container * ratio;
          } else {
            baseWidth = W_container;
            baseHeight = W_container / ratio;
          }

          if (crop) {
            setZoom(crop.zoom ?? 1.0);
            setPanX((crop.panX / 100) * baseWidth);
            setPanY((crop.panY / 100) * baseHeight);
            setFocalX(crop.focalX ?? 50);
            setFocalY(crop.focalY ?? 35);
            setAspectRatio(crop.aspectRatio ?? '3:4');
            setFit(crop.fit ?? 'cover');
          } else {
            setZoom(1.0);
            setPanX(0);
            setPanY(0);
            setFocalX(50);
            setFocalY(35);
            setAspectRatio('3:4');
            setFit('cover');
          }
        }
      };
    }
  }, [tempImageUrl, isCropModalOpen]);

  // Initialize or trigger crop modal when image URL is chosen/pasted
  const openCropperForImage = (url: string) => {
    if (isVideoUrl(url)) return;
    setTempImageUrl(url);
    setIsCropModalOpen(true);
  };

  const handleFile = async (file: File) => {
    setUploadError('');
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name);
    
    if (!isImg && !isVid) {
      setUploadError('Fadlan dooro sawir sax ah (JPG, PNG, WEBP) ama video (MP4, WEBM, MOV).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Cabbirka faylku waa inuu ka yaraadaa 50MB.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadMediaToServer(file);
      if (publicUrl) {
        onImageChange(publicUrl, undefined);
      } else {
        setUploadError('Waa uu fashilmay upload-ka faylka.');
      }
    } catch (err: any) {
      setUploadError('Waa uu fashilmay upload-ka: ' + (err?.message || 'qalad ayaa dhacay'));
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Fixed coordinates for the crop editor container size (480x360)
  const W_container = 480;
  const H_container = 360;

  // Calculate crop rectangle inside the 480x360 coordinates
  const getCropDimensions = () => {
    let ratio = 0.75; // Default 3:4 (width / height)
    if (aspectRatio === '1:1') ratio = 1.0;
    else if (aspectRatio === '4:3') ratio = 1.333;
    else if (aspectRatio === '16:9') ratio = 1.777;
    else if (aspectRatio === '9:16') ratio = 0.5625;
    else if (aspectRatio === 'custom') ratio = 0.75; // Fallback for custom

    let cropWidth = W_container * 0.85;
    let cropHeight = cropWidth / ratio;

    if (cropHeight > H_container * 0.85) {
      cropHeight = H_container * 0.85;
      cropWidth = cropHeight * ratio;
    }

    const cropX = (W_container - cropWidth) / 2;
    const cropY = (H_container - cropHeight) / 2;

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  };

  const cropRect = getCropDimensions();

  // Helper to get image layout dimensions inside workspace
  const getBaseDimensions = () => {
    const containerRatio = W_container / H_container;
    let baseWidth = W_container;
    let baseHeight = H_container;

    if (imgAspectRatio > containerRatio) {
      baseHeight = H_container;
      baseWidth = H_container * imgAspectRatio;
    } else {
      baseWidth = W_container;
      baseHeight = W_container / imgAspectRatio;
    }
    return { baseWidth, baseHeight };
  };

  const { baseWidth, baseHeight } = getBaseDimensions();

  // Handle Dragging / Panning of the image underneath the frame
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingImage) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let newPanX = dragStartRef.current.panX + dx;
      let newPanY = dragStartRef.current.panY + dy;

      const dispWidth = baseWidth * zoom;
      const dispHeight = baseHeight * zoom;

      // Calculate bounds where image completely covers the crop frame
      const minPanX = cropRect.x + cropRect.width - (W_container / 2) - (dispWidth / 2);
      const maxPanX = cropRect.x - (W_container / 2) + (dispWidth / 2);
      const minPanY = cropRect.y + cropRect.height - (H_container / 2) - (dispHeight / 2);
      const maxPanY = cropRect.y - (H_container / 2) + (dispHeight / 2);

      let clampMinX = minPanX;
      let clampMaxX = maxPanX;
      if (clampMinX > clampMaxX) {
        const temp = clampMinX;
        clampMinX = clampMaxX;
        clampMaxX = temp;
      }

      let clampMinY = minPanY;
      let clampMaxY = maxPanY;
      if (clampMinY > clampMaxY) {
        const temp = clampMinY;
        clampMinY = clampMaxY;
        clampMaxY = temp;
      }

      newPanX = Math.min(clampMaxX, Math.max(clampMinX, newPanX));
      newPanY = Math.min(clampMaxY, Math.max(clampMinY, newPanY));

      setPanX(Number(newPanX.toFixed(2)));
      setPanY(Number(newPanY.toFixed(2)));
    };

    const handleMouseUp = () => {
      setIsDraggingImage(false);
    };

    if (isDraggingImage) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingImage, zoom, baseWidth, baseHeight, cropRect.x, cropRect.y, cropRect.width, cropRect.height]);

  // Touch handlers for mobile cropping support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setIsDraggingImage(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panX,
      panY
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingImage || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent native browser scrolling/swiping
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;

    let newPanX = dragStartRef.current.panX + dx;
    let newPanY = dragStartRef.current.panY + dy;

    const dispWidth = baseWidth * zoom;
    const dispHeight = baseHeight * zoom;

    const minPanX = cropRect.x + cropRect.width - (W_container / 2) - (dispWidth / 2);
    const maxPanX = cropRect.x - (W_container / 2) + (dispWidth / 2);
    const minPanY = cropRect.y + cropRect.height - (H_container / 2) - (dispHeight / 2);
    const maxPanY = cropRect.y - (H_container / 2) + (dispHeight / 2);

    let clampMinX = minPanX;
    let clampMaxX = maxPanX;
    if (clampMinX > clampMaxX) {
      const temp = clampMinX;
      clampMinX = clampMaxX;
      clampMaxX = temp;
    }

    let clampMinY = minPanY;
    let clampMaxY = maxPanY;
    if (clampMinY > clampMaxY) {
      const temp = clampMinY;
      clampMinY = clampMaxY;
      clampMaxY = temp;
    }

    newPanX = Math.min(clampMaxX, Math.max(clampMinX, newPanX));
    newPanY = Math.min(clampMaxY, Math.max(clampMinY, newPanY));

    setPanX(Number(newPanX.toFixed(2)));
    setPanY(Number(newPanY.toFixed(2)));
  };

  // Set Focal point by clicking on crop window
  const handleCropFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent focal trigger if they were dragging
    if (isDraggingImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setFocalX(Math.round(clickX));
    setFocalY(Math.round(clickY));
  };

  // Zoom control helpers
  const handleZoomChange = (value: number) => {
    const newZoom = Math.min(5.0, Math.max(1.0, value));
    setZoom(newZoom);

    // Adjust existing pans if they exceed the new zoom limits
    const dispWidth = baseWidth * newZoom;
    const dispHeight = baseHeight * newZoom;

    const minPanX = cropRect.x + cropRect.width - (W_container / 2) - (dispWidth / 2);
    const maxPanX = cropRect.x - (W_container / 2) + (dispWidth / 2);
    const minPanY = cropRect.y + cropRect.height - (H_container / 2) - (dispHeight / 2);
    const maxPanY = cropRect.y - (H_container / 2) + (dispHeight / 2);

    let clampMinX = minPanX;
    let clampMaxX = maxPanX;
    if (clampMinX > clampMaxX) {
      const temp = clampMinX;
      clampMinX = clampMaxX;
      clampMaxX = temp;
    }

    let clampMinY = minPanY;
    let clampMaxY = maxPanY;
    if (clampMinY > clampMaxY) {
      const temp = clampMinY;
      clampMinY = clampMaxY;
      clampMaxY = temp;
    }

    setPanX((prev) => Math.min(clampMaxX, Math.max(clampMinX, prev)));
    setPanY((prev) => Math.min(clampMaxY, Math.max(clampMinY, prev)));
  };

  // Reset function inside cropper
  const handleReset = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setFocalX(50);
    setFocalY(35);
  };

  // Save and commit changes back to parent, converting pixels to persistent percentages
  const handleSaveAndApply = () => {
    setIsCropModalOpen(false);
    
    const savedPanX = Number(((panX / baseWidth) * 100).toFixed(2));
    const savedPanY = Number(((panY / baseHeight) * 100).toFixed(2));

    const adjustments: ImageAdjustments = {
      fit: 'cover',
      aspectRatio: aspectRatio as any,
      focalPoint: { x: focalX, y: focalY },
      crop: {
        zoom,
        panX: savedPanX,
        panY: savedPanY,
        focalX,
        focalY,
        aspectRatio,
        fit
      }
    };
    onImageChange(tempImageUrl, adjustments);
  };

  // Render the thumbnail preview inside the main form card (cropped according to settings)
  const renderCroppedPreviewStyle = (): React.CSSProperties => {
    if (crop) {
      return {
        objectPosition: `${crop.focalX ?? 50}% ${crop.focalY ?? 35}%`,
        objectFit: 'cover',
        transform: crop.zoom > 1 ? `scale(${crop.zoom})` : undefined,
        transformOrigin: `${crop.focalX ?? 50}% ${crop.focalY ?? 35}%`,
        width: '100%',
        height: '100%'
      };
    }
    return {
      objectPosition: '50% 35%',
      objectFit: 'cover',
      width: '100%',
      height: '100%'
    };
  };

  return (
    <div className="space-y-4 p-5 bg-white border border-neutral-200 shadow-xs rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
            <ImageIcon size={14} className="text-neutral-900" />
            <span>{label} {required && <span className="text-red-500">*</span>}</span>
          </h5>
          <p className="text-[10px] text-neutral-500">Facebook-style interactive cropping with live Customer View</p>
        </div>
        
        {!imageUrl && (
          <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-none text-[9px] uppercase font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Upload (Sawir &amp; Video)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'url' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              URL Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'presets' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Presets (Sawir &amp; Video)
            </button>
          </div>
        )}
      </div>

      {!imageUrl ? (
        <div className="space-y-2">
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={onDrop}
              className={`p-8 border-2 border-dashed text-center transition-all cursor-pointer relative bg-neutral-50 ${
                isDraggingFile ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <input 
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center border">
                  {isUploading ? <Loader2 size={18} className="animate-spin text-amber-600" /> : <Upload size={18} />}
                </div>
                <div className="text-xs font-bold text-neutral-700">
                  {isUploading ? 'Faylka waa la soo upload-gareynayaa (Uploading Media)...' : 'Riix ama soo jiid Sawir ama Video (Drop image or video to upload)'}
                </div>
                <p className="text-[10px] text-neutral-400">
                  {isUploading ? 'Fadlan sug daqiiqado yar inta la keydinayo...' : 'Taageeraya Sawirro (JPG, PNG, WEBP) & Videos (MP4, WEBM, MOV ilaa 50MB)'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="flex gap-2">
              <input
                type="url"
                id="url-input"
                placeholder="Ku dheji linkiga sawirka ama video-ga e.g. https://.../video.mp4 ama image.jpg"
                className="w-full p-2.5 border border-neutral-300 text-xs font-mono focus:outline-none focus:border-neutral-900 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) onImageChange(val, undefined);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = (document.getElementById('url-input') as HTMLInputElement)?.value.trim();
                  if (val) onImageChange(val, undefined);
                }}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-neutral-800 cursor-pointer"
              >
                Geli Si Caadi ah
              </button>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-50 p-2 border border-neutral-200">
              {samplePresets.map((preset, idx) => {
                const isVid = isVideoUrl(preset.url);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onImageChange(preset.url, undefined)}
                    className="group p-1.5 border border-neutral-200 bg-white hover:border-neutral-900 transition-all text-left flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-9 h-9 relative shrink-0 bg-black overflow-hidden flex items-center justify-center">
                      {isVid ? (
                        <video src={preset.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      )}
                      {isVid && (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-600 text-white text-[7px] font-bold text-center uppercase">
                          Video
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-700 group-hover:text-neutral-900 truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Image uploaded - display the active thumbnail with clear controls */
        <div className="flex flex-col md:flex-row items-center gap-4 bg-neutral-50 p-4 border border-neutral-200">
          <div className="relative w-36 h-48 bg-black border border-neutral-300 overflow-hidden shrink-0 shadow-sm flex items-end justify-center text-white">
            {imageUrl && imageUrl.trim() !== '' ? (
              isVideoUrl(imageUrl) ? (
                <video 
                  src={imageUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={imageUrl} 
                  alt="Active department thumbnail" 
                  style={renderCroppedPreviewStyle()}
                  referrerPolicy="no-referrer"
                />
              )
            ) : null}
            {/* Dark overlay mirroring actual homepage split */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/45 pointer-events-none" />
            
            {/* Small label indicating current mode */}
            <div className={`absolute top-2 left-2 text-[8px] uppercase tracking-wider px-2 py-0.5 font-bold ${
              isVideoUrl(imageUrl)
                ? 'bg-amber-600 text-white flex items-center gap-1'
                : crop ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white'
            }`}>
              {isVideoUrl(imageUrl) ? '🎬 Video Live' : crop ? '✂️ Custom Crop' : '📷 Asalka ah (Normal)'}
            </div>
          </div>

          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest inline-block ${
                isVideoUrl(imageUrl)
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : crop ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isVideoUrl(imageUrl)
                  ? '🎬 Video Hero (Autoplay & Loop Active)'
                  : crop ? 'Sawir La Jaray (Cropped)' : 'Sawir Caadi ah (Original - Aan la jarin)'}
              </span>
            </div>
            
            <p className="text-[11px] text-neutral-600">
              {isVideoUrl(imageUrl)
                ? 'Video-gan wuxuu si toos ah (autoplay & loop) ugu dhex wareegayaa homepage-ka adigoo muujinaya bilicda haute couture.'
                : crop 
                  ? 'Sawirkan waxaa lagu habeeyay habka jarista gaarka ah. Haddii aad rabto inaad si caadi ah u muujiso, riix badhanka hoose.' 
                  : 'Sawirkaagu wuxuu u muuqanayaa sidii asalka ahayd ee aad u gelisay (si caadi ah oo aan la jarin).'}
            </p>

            {!isVideoUrl(imageUrl) && crop && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-neutral-500 font-mono pt-1">
                <div>Aspect: <span className="text-neutral-900 font-bold">{crop.aspectRatio}</span></div>
                <div>Zoom: <span className="text-neutral-900 font-bold">{(crop.zoom * 100).toFixed(0)}%</span></div>
                <div>Focus: <span className="text-neutral-900 font-bold">X:{crop.focalX}% Y:{crop.focalY}%</span></div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {isVideoUrl(imageUrl) ? (
                <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Check size={12} className="text-amber-700" /> Video-gu Wuu Shidanyahay (Ready)
                </span>
              ) : crop ? (
                <button
                  type="button"
                  onClick={() => onImageChange(imageUrl, undefined)}
                  className="px-3.5 py-2 bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-bold hover:bg-emerald-800 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw size={12} /> Ku Celi Sawirka Caadiga ah (No Crop)
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Check size={12} className="text-emerald-700" /> Waa Caadi (Original Active)
                </span>
              )}

              {!isVideoUrl(imageUrl) && (
                <button
                  type="button"
                  onClick={() => openCropperForImage(imageUrl)}
                  className="px-3.5 py-2 border border-neutral-800 text-neutral-900 bg-white hover:bg-neutral-900 hover:text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Crop size={12} /> {crop ? 'Wax Ka Beddel Jarista' : '✂️ Jar / Cabbir (Optional Crop)'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onImageChange('', undefined)}
                className="px-3 py-2 border border-red-200 text-red-600 bg-white hover:bg-red-50 text-[10px] uppercase tracking-wider font-bold cursor-pointer"
              >
                Tirtir
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 pt-1">
          <X size={12} /> {uploadError}
        </p>
      )}

      {/* DEDICATED VISUAL CROP MODAL / OVERLAY */}
      {isCropModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/70 z-[1000] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-5xl shadow-2xl flex flex-col md:flex-row border border-neutral-300">
            
            {/* LEFT COLUMN: Visual interactive cropper workspace */}
            <div className="w-full md:w-1/2 p-6 border-r border-neutral-100 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Atelier Editorial</span>
                  <h4 className="text-sm font-serif font-bold text-neutral-900">Crop Department Hero Background</h4>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-900 border p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Crop Canvas container with the SVG cutout crop mask overlay */}
              <div 
                className="relative bg-neutral-950 flex items-center justify-center overflow-hidden border border-neutral-800"
                style={{ width: `${W_container}px`, height: `${H_container}px`, maxWidth: '100%' }}
              >
                {/* Original Image beneath the cutout, draggable and zoomable */}
                {tempImageUrl && tempImageUrl.trim() !== '' ? (
                  <img 
                    src={tempImageUrl} 
                    alt="Original workspace" 
                    className="absolute select-none pointer-events-none"
                    style={{
                      position: 'absolute',
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                      left: `${(W_container - baseWidth) / 2}px`,
                      top: `${(H_container - baseHeight) / 2}px`,
                      transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      maxWidth: 'none',
                      maxHeight: 'none'
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : null}

                {/* Mathematical Dimmed Overlay using an SVG cutout pattern */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <defs>
                    <mask id="modal-crop-mask">
                      {/* White reveals overlay, black reveals the original image through cutout */}
                      <rect width="100%" height="100%" fill="white" />
                      <rect 
                        x={cropRect.x} 
                        y={cropRect.y} 
                        width={cropRect.width} 
                        height={cropRect.height} 
                        fill="black" 
                      />
                    </mask>
                  </defs>
                  {/* The actual dimmed background covering area outside crop rect */}
                  <rect 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0, 0, 0, 0.65)" 
                    mask="url(#modal-crop-mask)" 
                  />
                  {/* Stable Crop Frame Border */}
                  <rect 
                    x={cropRect.x} 
                    y={cropRect.y} 
                    width={cropRect.width} 
                    height={cropRect.height} 
                    fill="transparent" 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                </svg>

                {/* Highly interactive invisible drag region exactly bounded by the crop cutout */}
                <div 
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onClick={handleCropFrameClick}
                  className={`absolute z-20 cursor-crosshair`}
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.width}px`,
                    height: `${cropRect.height}px`
                  }}
                  title="Drag to position image / Click to set Focal point"
                >
                  {/* Focal point visual marker target overlay */}
                  <div 
                    className="absolute w-6 h-6 border-2 border-white rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all shadow-lg"
                    style={{ 
                      left: `${focalX}%`, 
                      top: `${focalY}%`, 
                      backgroundColor: 'rgba(212, 175, 55, 0.45)', // Lana Gold highlight
                      borderColor: '#D4AF37'
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>

                {/* Small indicator label */}
                <div className="absolute bottom-2 right-2 bg-neutral-900/80 text-white text-[8px] uppercase tracking-widest px-2 py-0.5 z-30 font-sans pointer-events-none">
                  Workspace Canvas
                </div>
              </div>

              {/* Zoom and Aspect Ratio Controls */}
              <div className="space-y-4 pt-1">
                {/* 1. Zoom Slider Section */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase">
                    <span>Magnify/Zoom Alignment</span>
                    <span className="font-mono text-neutral-800">{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom - 0.1)}
                      className="p-1.5 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <input 
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-neutral-900 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom + 0.1)}
                      className="p-1.5 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-2.5 py-1.5 border border-neutral-200 text-[10px] font-bold uppercase hover:bg-neutral-50 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>

                {/* 2. Target Aspect Ratio Section */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block">Selected Aspect Ratio Crop</span>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: '1:1', label: '1:1 Square', desc: 'Category grid' },
                      { id: '3:4', label: '3:4 Editorial', desc: 'Most standard' },
                      { id: '4:3', label: '4:3 Landscape', desc: 'Banners' },
                      { id: '16:9', label: '16:9 Cinematic', desc: 'Wide banners' },
                      { id: '9:16', label: '9:16 Portrait', desc: 'Mobile campaign' }
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`p-1.5 border text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                          aspectRatio === ratio.id 
                            ? 'border-neutral-900 bg-neutral-900 text-white' 
                            : 'border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{ratio.id}</span>
                        <span className="text-[8px] opacity-60 block scale-90">{ratio.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live result customer preview simulations */}
            <div className="w-full md:w-1/2 p-6 bg-neutral-50 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">What Customers Will See</span>
                  <h4 className="text-sm font-serif font-normal text-neutral-900">Live Device Simulation</h4>
                </div>
                
                {/* Desktop / Mobile view toggle tabs */}
                <div className="flex bg-neutral-200/60 p-0.5 text-[9px] font-bold uppercase shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1 flex items-center gap-1 cursor-pointer transition-all ${
                      previewMode === 'desktop' ? 'bg-white text-neutral-900 font-bold shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Monitor size={11} /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 flex items-center gap-1 cursor-pointer transition-all ${
                      previewMode === 'mobile' ? 'bg-white text-neutral-900 font-bold shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Smartphone size={11} /> Mobile
                  </button>
                </div>
              </div>

              {/* Rendering container simulating exact customer side viewport framing */}
              <div className="flex-1 flex items-center justify-center min-h-[280px]">
                {previewMode === 'desktop' ? (
                  /* Desktop mockup split column preview */
                  <div className="w-full max-w-sm bg-white border border-neutral-200 shadow-md flex flex-col overflow-hidden">
                    <div className="bg-neutral-100 border-b p-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      <span className="text-[8px] font-mono text-neutral-400 ml-2">Maison Lana split viewport</span>
                    </div>

                    <div className="relative w-full h-80 bg-neutral-950 flex flex-col justify-end overflow-hidden group">
                      {/* EXACT crop translation/scaling system used on frontend */}
                      {tempImageUrl && tempImageUrl.trim() !== '' ? (
                        <img 
                          src={tempImageUrl} 
                          alt="Desktop Live View" 
                          className="absolute inset-0 select-none pointer-events-none"
                          style={{
                            transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
                            transformOrigin: 'center center',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      {/* Dark overlay gradient matching the site */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/55" />

                      {/* Editorial Title Overlay */}
                      <div className="relative z-10 w-full px-4 pb-12 text-center flex flex-col items-center select-none pointer-events-none">
                        <h4 className="font-serif text-[26px] font-light text-white tracking-wide leading-tight drop-shadow-md">
                          {label.replace(' Hero Background Image', '')}
                        </h4>
                        <span className="text-[12px] text-white font-normal underline underline-offset-4 mt-2 tracking-wider">
                          Shop now
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mobile mockup device preview */
                  <div className="w-56 h-[340px] bg-white border-4 border-neutral-900 rounded-[24px] shadow-xl overflow-hidden relative flex flex-col">
                    <div className="h-3.5 bg-neutral-900 w-20 mx-auto rounded-b-md absolute top-0 left-1/2 -translate-x-1/2 z-30" />
                    <div className="w-full h-full relative bg-neutral-950 flex flex-col justify-end overflow-hidden">
                      {tempImageUrl && tempImageUrl.trim() !== '' ? (
                        <img 
                          src={tempImageUrl} 
                          alt="Mobile Live View" 
                          className="absolute inset-0 select-none pointer-events-none"
                          style={{
                            transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
                            transformOrigin: 'center center',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/60" />

                      {/* Mobile Editorial Title Overlay */}
                      <div className="relative z-10 w-full px-3 pb-8 text-center flex flex-col items-center select-none pointer-events-none">
                        <h4 className="font-serif text-[18px] font-light text-white tracking-wide leading-tight drop-shadow">
                          {label.replace(' Hero Background Image', '')}
                        </h4>
                        <span className="text-[10px] text-white font-normal underline underline-offset-4 mt-1">
                          Shop now
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification & Quality Audit Checklist */}
              <div className="p-3.5 bg-white border border-neutral-200 space-y-2 text-[10px] text-neutral-600 leading-relaxed rounded-none">
                <span className="text-[9px] uppercase font-bold text-amber-800 flex items-center gap-1 tracking-wider">
                  <AlertCircle size={12} /> Editorial Quality Guidelines
                </span>
                <ul className="space-y-1 list-disc pl-3">
                  <li>Ensure model faces/important subjects sit directly in the clear frame area.</li>
                  <li>Verify that typography title & button overlays remain fully legible over the background.</li>
                  <li>Check both Desktop & Mobile previews to verify perfect responsive visual framing.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCropModalOpen(false);
                    onImageChange(tempImageUrl, undefined);
                  }}
                  className="px-4 py-2 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[11px] uppercase font-bold tracking-wider hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                  title="Ha jarin sawirka, si caadi ah u isticmaal"
                >
                  <Check size={12} /> Isticmaal Si Caadi ah (No Crop)
                </button>
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 text-[11px] uppercase font-bold tracking-wider hover:bg-neutral-50 cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndApply}
                  className="px-5 py-2.5 bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-bold hover:bg-neutral-800 cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Check size={12} /> Save & Apply Crop
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
