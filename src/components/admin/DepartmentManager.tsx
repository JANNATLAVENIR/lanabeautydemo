import React, { useState, useRef, useEffect } from 'react';
import { Layers, Folder, Package, Edit3, ArrowRight, Check, Eye, EyeOff, RefreshCw, HelpCircle, LayoutGrid, Plus, RotateCcw, Trash2, MoveVertical, Sliders, ZoomIn, ZoomOut, ChevronUp, ChevronDown, X, Sparkles, Play, Pause, ChevronLeft, ChevronRight, Image as ImageIcon, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Category, Product } from '../../types';
import { MediaManager, ImageAdjustments } from './MediaManager';
import { isVideoUrl, LUXURY_VIDEO_PRESETS, LUXURY_IMAGE_PRESETS, uploadMediaToServer } from '../../lib/media';

import heroCampaignImg from '../../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import beautyHeroImg from '../../assets/images/dior_lightbrown_beauty_diamonds_perfume_1788954970837.jpg';

interface DepartmentManagerProps {
  categories: Category[];
  products: Product[];
  homepageSettings: any;
  onSaveHomepageSettings: (settings: any) => Promise<void>;
  onRefresh: () => void;
  onOpenCategoryWizard?: (department?: string) => void;
  onEditCategoryWizard?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string, categoryName: string) => Promise<void>;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  description: string;
  categoryCount: number;
  productCount: number;
  heroImage: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  slideImages?: string[];
  autoSlide?: boolean;
  slideInterval?: number;
  eyebrow: string;
  title: string;
  ctaText: string;
  placements: ('navigation' | 'homepage' | 'mega-menu' | 'sidebar')[];
  isCustom?: boolean;
  imagePosition?: string;
  overlayOpacity?: string;
  isActive?: boolean;
  crop?: any;
}

export function DepartmentManager({ 
  categories, 
  products, 
  homepageSettings, 
  onSaveHomepageSettings, 
  onRefresh,
  onOpenCategoryWizard,
  onEditCategoryWizard,
  onDeleteCategory
}: DepartmentManagerProps) {
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [isNewDept, setIsNewDept] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Department State mapping based on home settings
  const baseDepartments: DepartmentInfo[] = [
    {
      id: 'Fashion',
      name: 'Fashion & Accessories',
      description: 'High-end designer dresses, gowns, coats, luxury bags, and runway wear.',
      categoryCount: (categories || []).filter(c => c.department === 'Fashion').length,
      productCount: (products || []).filter(p => p.department === 'Fashion').length,
      heroImage: homepageSettings?.heroFashionVideo || (homepageSettings?.heroFashionImage && homepageSettings.heroFashionImage.trim() ? homepageSettings.heroFashionImage.trim() : heroCampaignImg),
      videoUrl: homepageSettings?.heroFashionVideo || '',
      mediaType: homepageSettings?.heroFashionMediaType || (homepageSettings?.heroFashionVideo ? 'video' : 'image'),
      slideImages: homepageSettings?.heroFashionSlideImages || [],
      autoSlide: homepageSettings?.heroFashionAutoSlide !== false,
      slideInterval: homepageSettings?.heroFashionSlideInterval || 5,
      eyebrow: '',
      title: homepageSettings?.heroFashionTitle || 'Fashion & Accessories',
      ctaText: homepageSettings?.heroFashionCta || 'Shop now',
      placements: homepageSettings?.heroFashionActive !== false ? ['navigation', 'homepage', 'mega-menu'] : ['navigation', 'mega-menu'],
      imagePosition: homepageSettings?.heroFashionImagePosition || 'object-[50%_35%]',
      overlayOpacity: homepageSettings?.heroFashionOverlayOpacity || 'medium',
      isActive: homepageSettings?.heroFashionActive !== false,
      crop: homepageSettings?.heroFashionCrop
    },
    {
      id: 'Beauty',
      name: 'Fragrance & Beauty',
      description: 'Exclusive oriental oriental oud, premium French perfumes, makeup, and advanced skincare.',
      categoryCount: (categories || []).filter(c => c.department === 'Beauty').length,
      productCount: (products || []).filter(p => p.department === 'Beauty').length,
      heroImage: homepageSettings?.heroBeautyVideo || (homepageSettings?.heroBeautyImage && homepageSettings.heroBeautyImage.trim() ? homepageSettings.heroBeautyImage.trim() : beautyHeroImg),
      videoUrl: homepageSettings?.heroBeautyVideo || '',
      mediaType: homepageSettings?.heroBeautyMediaType || (homepageSettings?.heroBeautyVideo ? 'video' : 'image'),
      slideImages: homepageSettings?.heroBeautySlideImages || [],
      autoSlide: homepageSettings?.heroBeautyAutoSlide !== false,
      slideInterval: homepageSettings?.heroBeautySlideInterval || 5,
      eyebrow: '',
      title: homepageSettings?.heroBeautyTitle || 'Fragrance & Beauty',
      ctaText: homepageSettings?.heroBeautyCta || 'Shop now',
      placements: homepageSettings?.heroBeautyActive !== false ? ['navigation', 'homepage', 'mega-menu'] : ['navigation', 'mega-menu'],
      imagePosition: homepageSettings?.heroBeautyImagePosition || 'object-[50%_35%]',
      overlayOpacity: homepageSettings?.heroBeautyOverlayOpacity || 'medium',
      isActive: homepageSettings?.heroBeautyActive !== false,
      crop: homepageSettings?.heroBeautyCrop
    }
  ];

  // Retrieve custom departments stored as homepage banners, ensuring unique IDs
  const seenDeptIds = new Set<string>();
  const customDepts: DepartmentInfo[] = (homepageSettings?.additionalBanners || [])
    .filter((b: any) => {
      if (!b.id || !b.id.startsWith('dept-banner-')) return false;
      if (seenDeptIds.has(b.id)) return false;
      seenDeptIds.add(b.id);
      return true;
    })
    .map((b: any) => {
      const deptId = b.id.replace('dept-banner-', '');
      return {
        id: b.id,
        name: b.title || `Waax Custom (${deptId})`,
        description: 'Waax cusub oo maamulaha ku daray homepage-ka si toos ah (Custom-added department).',
        categoryCount: (categories || []).filter(c => c.department?.toLowerCase() === deptId.toLowerCase()).length,
        productCount: (products || []).filter(p => p.department?.toLowerCase() === deptId.toLowerCase()).length,
        heroImage: b.videoUrl || b.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
        videoUrl: b.videoUrl || '',
        mediaType: b.mediaType || (b.videoUrl ? 'video' : 'image'),
        slideImages: b.slideImages || [],
        autoSlide: b.autoSlide !== false,
        slideInterval: b.slideInterval || 5,
        eyebrow: '',
        title: b.title,
        ctaText: b.ctaText || 'Shop now',
        placements: ['homepage'],
        isCustom: true,
        imagePosition: b.imagePosition || 'object-[50%_35%]',
        overlayOpacity: b.overlayOpacity || 'medium',
        isActive: b.active !== false,
        crop: b.crop
      };
    });

  const departments = [...baseDepartments, ...customDepts];

  // Forms states for editing a department
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800');
  const [formSlideImages, setFormSlideImages] = useState<string[]>([]);
  const [formAutoSlide, setFormAutoSlide] = useState<boolean>(true);
  const [formSlideInterval, setFormSlideInterval] = useState<number>(5);
  const [newSlideUrl, setNewSlideUrl] = useState<string>('');
  const [slideActiveTab, setSlideActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingSlideFile, setIsDraggingSlideFile] = useState<boolean>(false);
  const [slideUploadError, setSlideUploadError] = useState<string>('');
  const [isUploadingSlides, setIsUploadingSlides] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  const handleSlideFiles = async (files: FileList | File[]) => {
    setSlideUploadError('');
    const fileArray = Array.from(files);
    const validMedia = fileArray.filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') || 
      /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name)
    );
    
    if (validMedia.length === 0) {
      setSlideUploadError('Fadlan soo dooro sawir (JPG, PNG, WEBP) ama video (MP4, WEBM, MOV) sax ah.');
      return;
    }

    const overSized = validMedia.find(f => f.size > 50 * 1024 * 1024);
    if (overSized) {
      setSlideUploadError('Cabbirka fayl kasta waa inuu ka yaraadaa 50MB.');
      return;
    }

    setIsUploadingSlides(true);
    try {
      for (const file of validMedia) {
        const publicUrl = await uploadMediaToServer(file);
        if (publicUrl) {
          setFormSlideImages(prev => [...prev, publicUrl]);
        }
      }
    } catch (err: any) {
      setSlideUploadError('Waa uu fashilmay upload-ka slide-ka: ' + (err?.message || 'qalad ayaa dhacay'));
    } finally {
      setIsUploadingSlides(false);
    }
  };

  const [formEyebrow, setFormEyebrow] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCta, setFormCta] = useState('');
  const [formPlacements, setFormPlacements] = useState<('navigation' | 'homepage' | 'mega-menu' | 'sidebar')[]>([]);
  const [formImagePosition, setFormImagePosition] = useState('object-[50%_18%]');
  const [formOverlayOpacity, setFormOverlayOpacity] = useState('medium');
  const [formActive, setFormActive] = useState(true);
  const [formCrop, setFormCrop] = useState<any>(undefined);
  const [formFocalY, setFormFocalY] = useState<number>(18);
  const [formZoom, setFormZoom] = useState<number>(1.0);
  const [isDraggingForm, setIsDraggingForm] = useState<boolean>(false);
  const dragFormStartRef = useRef<{ clientY: number; initialFocalY: number }>({ clientY: 0, initialFocalY: 18 });

  // Quick Reposition Modal State
  const [repositionDept, setRepositionDept] = useState<DepartmentInfo | null>(null);
  const [modalFocalY, setModalFocalY] = useState<number>(18);
  const [modalZoom, setModalZoom] = useState<number>(1.0);
  const [isDraggingModal, setIsDraggingModal] = useState<boolean>(false);
  const [isSavingReposition, setIsSavingReposition] = useState<boolean>(false);
  const dragModalStartRef = useRef<{ clientY: number; initialFocalY: number }>({ clientY: 0, initialFocalY: 18 });

  const getDeptFocalY = (dept: DepartmentInfo): number => {
    if (dept.crop?.focalY !== undefined) return Number(dept.crop.focalY);
    if (dept.imagePosition) {
      const match = dept.imagePosition.match(/object-\[50%_(\d+)%\]/);
      if (match && match[1]) return Number(match[1]);
      if (dept.imagePosition === 'object-top') return 0;
      if (dept.imagePosition === 'object-bottom') return 100;
    }
    return 18;
  };

  const getDeptZoom = (dept: DepartmentInfo): number => {
    if (dept.crop?.zoom !== undefined && dept.crop.zoom > 0) return Number(dept.crop.zoom);
    return 1.0;
  };

  const openRepositionModal = (dept: DepartmentInfo) => {
    setRepositionDept(dept);
    setModalFocalY(getDeptFocalY(dept));
    setModalZoom(getDeptZoom(dept));
  };

  const startEdit = (dept: DepartmentInfo) => {
    setEditingDept(dept.id);
    setIsNewDept(false);
    setFormImage(dept.heroImage);
    setFormSlideImages(dept.slideImages ? [...dept.slideImages] : []);
    setFormAutoSlide(dept.autoSlide !== false);
    setFormSlideInterval(dept.slideInterval || 5);
    setNewSlideUrl('');
    setFormEyebrow('');
    setFormTitle(dept.title);
    setFormCta(dept.ctaText || 'Shop now');
    setFormPlacements(dept.placements);
    setFormImagePosition(dept.imagePosition || 'object-[50%_18%]');
    setFormOverlayOpacity(dept.overlayOpacity || 'medium');
    setFormActive(dept.isActive !== false);
    setFormCrop(dept.crop);
    setFormFocalY(getDeptFocalY(dept));
    setFormZoom(getDeptZoom(dept));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const startCreateNew = () => {
    setEditingDept('new_dept');
    setIsNewDept(true);
    setFormImage('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800');
    setFormSlideImages([]);
    setFormAutoSlide(true);
    setFormSlideInterval(5);
    setNewSlideUrl('');
    setFormEyebrow('');
    setFormTitle('');
    setFormCta('Shop now'); // Pre-filled automatically as standard!
    setFormPlacements(['homepage']);
    setFormImagePosition('object-[50%_18%]');
    setFormOverlayOpacity('medium');
    setFormActive(true);
    setFormCrop(undefined);
    setFormFocalY(18);
    setFormZoom(1.0);
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Drag event listeners for Reposition Modal
  useEffect(() => {
    if (!isDraggingModal) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragModalStartRef.current.clientY;
      // Dragging down pulls image down (decreases focalY to show top), dragging up pushes image up (increases focalY)
      const sensitivity = 0.22;
      const nextY = Math.min(100, Math.max(0, Math.round(dragModalStartRef.current.initialFocalY - deltaY * sensitivity)));
      setModalFocalY(nextY);
    };

    const onMouseUp = () => {
      setIsDraggingModal(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - dragModalStartRef.current.clientY;
        const sensitivity = 0.22;
        const nextY = Math.min(100, Math.max(0, Math.round(dragModalStartRef.current.initialFocalY - deltaY * sensitivity)));
        setModalFocalY(nextY);
      }
    };

    const onTouchEnd = () => {
      setIsDraggingModal(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingModal]);

  // Drag event listeners for In-form interactive drag
  useEffect(() => {
    if (!isDraggingForm) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragFormStartRef.current.clientY;
      const sensitivity = 0.22;
      const nextY = Math.min(100, Math.max(0, Math.round(dragFormStartRef.current.initialFocalY - deltaY * sensitivity)));
      setFormFocalY(nextY);
      setFormImagePosition(`object-[50%_${nextY}%]`);
    };

    const onMouseUp = () => {
      setIsDraggingForm(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - dragFormStartRef.current.clientY;
        const sensitivity = 0.22;
        const nextY = Math.min(100, Math.max(0, Math.round(dragFormStartRef.current.initialFocalY - deltaY * sensitivity)));
        setFormFocalY(nextY);
        setFormImagePosition(`object-[50%_${nextY}%]`);
      }
    };

    const onTouchEnd = () => {
      setIsDraggingForm(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingForm]);

  const handleSaveReposition = async () => {
    if (!repositionDept) return;
    setIsSavingReposition(true);
    try {
      const updatedSettings = { ...homepageSettings };
      const existingBanners = Array.isArray(updatedSettings.additionalBanners) ? [...updatedSettings.additionalBanners] : [];
      const deptId = repositionDept.id;

      const newCrop = {
        ...(repositionDept.crop || {}),
        focalY: modalFocalY,
        zoom: modalZoom,
        fit: 'cover'
      };
      const newPos = `object-[50%_${modalFocalY}%]`;

      if (deptId === 'Fashion') {
        updatedSettings.heroFashionCrop = newCrop;
        updatedSettings.heroFashionImagePosition = newPos;
      } else if (deptId === 'Beauty') {
        updatedSettings.heroBeautyCrop = newCrop;
        updatedSettings.heroBeautyImagePosition = newPos;
      } else {
        const bannerIdx = existingBanners.findIndex(b => b.id === deptId);
        if (bannerIdx !== -1) {
          existingBanners[bannerIdx] = {
            ...existingBanners[bannerIdx],
            crop: newCrop,
            imagePosition: newPos
          };
          updatedSettings.additionalBanners = existingBanners;
        }
      }

      await onSaveHomepageSettings(updatedSettings);
      setSuccessMsg(`Booska sawirka "${repositionDept.title || repositionDept.name}" waa la toosiyay laguna kaydiyay ${modalFocalY}%!`);
      setRepositionDept(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wuu fashilmay kaydinta booska.');
    } finally {
      setIsSavingReposition(false);
    }
  };

  // Confirmation state variables to bypass browser window.confirm (blocked in sandboxed iframe)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const handleDeleteDepartment = async (deptId: string) => {
    try {
      const updatedSettings = { ...homepageSettings };
      if (deptId === 'Fashion') {
        updatedSettings.heroFashionActive = false;
        setSuccessMsg('Qaybta "Fashion & Accessories" waa laga saaray (tirtiray) homepage-ka!');
      } else if (deptId === 'Beauty') {
        updatedSettings.heroBeautyActive = false;
        setSuccessMsg('Qaybta "Fragrance & Beauty" waa laga saaray (tirtiray) homepage-ka!');
      } else {
        const existingBanners = Array.isArray(updatedSettings.additionalBanners) ? [...updatedSettings.additionalBanners] : [];
        const filtered = (existingBanners || []).filter(b => b.id !== deptId);
        updatedSettings.additionalBanners = filtered;
        setSuccessMsg('Waaxda custom-ka ah si guul leh ayaa loo tirtiray!');
      }

      await onSaveHomepageSettings(updatedSettings);
      setConfirmDeleteId(null);
    } catch (err: any) {
      setErrorMsg('Tirtiriddu waa ay fashilantay.');
    }
  };

  const handleActivateDepartment = async (deptId: string) => {
    try {
      const updatedSettings = { ...homepageSettings };
      if (deptId === 'Fashion') {
        updatedSettings.heroFashionActive = true;
        setSuccessMsg('Qaybta "Fashion & Accessories" waa dib loogu soo celiyay homepage-ka!');
      } else if (deptId === 'Beauty') {
        updatedSettings.heroBeautyActive = true;
        setSuccessMsg('Qaybta "Fragrance & Beauty" waa dib loogu soo celiyay homepage-ka!');
      }

      await onSaveHomepageSettings(updatedSettings);
    } catch (err: any) {
      setErrorMsg('Soo celintu waa ay fashilantay.');
    }
  };

  const handleResetToDefaultImages = async () => {
    try {
      const updatedSettings = { ...homepageSettings };
      updatedSettings.heroFashionImage = '';
      updatedSettings.heroFashionVideo = '';
      updatedSettings.heroFashionMediaType = 'image';
      updatedSettings.heroBeautyImage = '';
      updatedSettings.heroBeautyVideo = '';
      updatedSettings.heroBeautyMediaType = 'image';
      
      await onSaveHomepageSettings(updatedSettings);
      setSuccessMsg('Sawirradii asalka ahaa ee gabdhaha si guul leh ayaa loogu soo celiyay Homepage-ga!');
      setConfirmReset(false);
    } catch (err: any) {
      setErrorMsg('Waa uu fashilmay soo celinta sawirrada.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    
    setSuccessMsg('');
    setErrorMsg('');
    setIsSaving(true);

    try {
      // Ensure any pending data URLs are uploaded to server to prevent DB bloat and slow network transfer
      let savedHeroImage = formImage;
      if (savedHeroImage && savedHeroImage.startsWith('data:')) {
        savedHeroImage = await uploadMediaToServer(savedHeroImage, `${editingDept}-hero`);
      }

      let savedSlideImages = [...formSlideImages];
      if (savedSlideImages.some(img => img && img.startsWith('data:'))) {
        savedSlideImages = await Promise.all(
          savedSlideImages.map(async (img, idx) => {
            if (img && img.startsWith('data:')) {
              return await uploadMediaToServer(img, `${editingDept}-slide-${idx}`);
            }
            return img;
          })
        );
      }

      const updatedSettings = { ...homepageSettings };
      const existingBanners = Array.isArray(updatedSettings.additionalBanners) ? [...updatedSettings.additionalBanners] : [];

      const finalCrop = {
        ...(formCrop || {}),
        focalY: formFocalY,
        zoom: formZoom,
        fit: 'cover'
      };
      const finalImagePosition = `object-[50%_${formFocalY}%]`;
      const isVid = isVideoUrl(savedHeroImage);

      if (editingDept === 'Fashion') {
        updatedSettings.heroFashionImage = savedHeroImage;
        updatedSettings.heroFashionVideo = isVid ? savedHeroImage : '';
        updatedSettings.heroFashionMediaType = isVid ? 'video' : 'image';
        updatedSettings.heroFashionSlideImages = savedSlideImages;
        updatedSettings.heroFashionAutoSlide = formAutoSlide;
        updatedSettings.heroFashionSlideInterval = formSlideInterval;
        updatedSettings.heroFashionEyebrow = '';
        updatedSettings.heroFashionTitle = formTitle;
        updatedSettings.heroFashionCta = formCta;
        updatedSettings.heroFashionImagePosition = finalImagePosition;
        updatedSettings.heroFashionOverlayOpacity = formOverlayOpacity;
        updatedSettings.heroFashionActive = formActive;
        updatedSettings.heroFashionCrop = finalCrop;
      } else if (editingDept === 'Beauty') {
        updatedSettings.heroBeautyImage = savedHeroImage;
        updatedSettings.heroBeautyVideo = isVid ? savedHeroImage : '';
        updatedSettings.heroBeautyMediaType = isVid ? 'video' : 'image';
        updatedSettings.heroBeautySlideImages = savedSlideImages;
        updatedSettings.heroBeautyAutoSlide = formAutoSlide;
        updatedSettings.heroBeautySlideInterval = formSlideInterval;
        updatedSettings.heroBeautyEyebrow = '';
        updatedSettings.heroBeautyTitle = formTitle;
        updatedSettings.heroBeautyCta = formCta;
        updatedSettings.heroBeautyImagePosition = finalImagePosition;
        updatedSettings.heroBeautyOverlayOpacity = formOverlayOpacity;
        updatedSettings.heroBeautyActive = formActive;
        updatedSettings.heroBeautyCrop = finalCrop;
      } else if (isNewDept) {
        // Create new department banner
        const fallbackId = `custom-${Date.now()}`;
        const deptSlug = formTitle.trim() ? formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : fallbackId;
        const deptBannerId = `dept-banner-${deptSlug}`;
        
        const bannerData = {
          id: deptBannerId,
          title: formTitle,
          subtitle: '',
          image: savedHeroImage,
          videoUrl: isVid ? savedHeroImage : '',
          mediaType: isVid ? 'video' : 'image',
          slideImages: savedSlideImages,
          autoSlide: formAutoSlide,
          slideInterval: formSlideInterval,
          ctaText: formCta,
          linkView: deptSlug,
          active: formActive,
          imagePosition: finalImagePosition,
          overlayOpacity: formOverlayOpacity,
          crop: finalCrop
        };

        const existingIdx = existingBanners.findIndex(b => b.id === deptBannerId);
        if (existingIdx !== -1) {
          existingBanners[existingIdx] = bannerData;
        } else {
          existingBanners.push(bannerData);
        }

        // Clean any historical duplicates in additionalBanners
        const seenIds = new Set<string>();
        const uniqueBanners = (existingBanners || []).filter(b => {
          if (!b.id) return true;
          if (seenIds.has(b.id)) return false;
          seenIds.add(b.id);
          return true;
        });

        updatedSettings.additionalBanners = uniqueBanners;
      } else {
        // Edit existing custom department banner
        const existingIdx = existingBanners.findIndex(b => b.id === editingDept);
        if (existingIdx !== -1) {
          existingBanners[existingIdx] = {
            ...existingBanners[existingIdx],
            title: formTitle,
            image: savedHeroImage,
            videoUrl: isVid ? savedHeroImage : '',
            mediaType: isVid ? 'video' : 'image',
            slideImages: savedSlideImages,
            autoSlide: formAutoSlide,
            slideInterval: formSlideInterval,
            ctaText: formCta,
            active: formActive,
            imagePosition: finalImagePosition,
            overlayOpacity: formOverlayOpacity,
            crop: finalCrop
          };
          updatedSettings.additionalBanners = existingBanners;
        }
      }

      await onSaveHomepageSettings(updatedSettings);
      setSuccessMsg(isNewDept ? `Waax cusub oo la yiraahdo "${formTitle}" waa la abuuray!` : `Waaxda "${formTitle}" waa la kaydiyay si guul leh!`);
      setEditingDept(null);
      setIsNewDept(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Waa uu fashilmay kaydinta qeybta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-serif text-neutral-900 font-normal">Department Hierarchy & Placement CMS</h3>
          <p className="text-xs text-neutral-500">Manage top-level departments, view item distribution, and assign website placements.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-300 text-neutral-700 font-sans text-xs hover:bg-neutral-50 hover:text-neutral-950 transition-all font-semibold uppercase tracking-wider"
            title="Restore original girl campaign images on homepage"
          >
            <RotateCcw size={14} /> Reset Girl Images
          </button>
          <button
            onClick={startCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white font-sans text-xs hover:bg-neutral-800 transition-all font-semibold uppercase tracking-wider"
          >
            <Plus size={14} /> New Department
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans font-bold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-sans font-bold">
          {errorMsg}
        </div>
      )}

      {editingDept ? (
        /* EDIT DEPARTMENT PROGRESSIVE WIZARD */
        <div className="bg-white border border-neutral-200 p-6 space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-600 font-sans tracking-widest">
                WHAT AM I CREATING? / WHERE WILL IT APPEAR?
              </span>
              <h4 className="text-lg font-serif font-bold text-neutral-900">
                {isNewDept ? 'Kudar Waax Cusub (Add New Department)' : `Configure & Layout: ${editingDept} Department`}
              </h4>
            </div>
            <button 
              type="button"
              onClick={() => setEditingDept(null)}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 border px-2.5 py-1"
            >
              Back to Overview
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Step 1: Content placement information */}
            <div className="grid md:grid-cols-2 gap-4 bg-neutral-50 p-4 border">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  Department Placement (Where it will appear on customer site):
                </label>
                <div className="space-y-2 pt-1">
                  {[
                    { id: 'navigation', label: 'Main Header Navigation Menu (Shop Navigation)' },
                    { id: 'homepage', label: 'Homepage Dual Cinematic Split Campaign Grid' },
                    { id: 'mega-menu', label: 'Header Mega-Menu Featured Column' },
                    { id: 'sidebar', label: 'Mobile Dropdown Filter Navigation & Sidebar' }
                  ].map((p) => {
                    const isSelected = formPlacements.includes(p.id as any);
                    return (
                      <label key={p.id} className="flex items-start gap-2 cursor-pointer font-sans text-neutral-700">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setFormPlacements(prev => prev.filter(item => item !== p.id));
                            } else {
                              setFormPlacements(prev => [...prev, p.id as any]);
                            }
                          }}
                          className="mt-0.5 accent-neutral-900"
                        />
                        <div>
                          <span className="font-bold text-neutral-900 block">{p.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                  Visual Copywriting Placement
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">EDITORIAL HERO TITLE (DEPARTMENT NAME) - <span className="text-neutral-400 font-normal italic font-sans lowercase">optional</span></label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Shoes & Bags (Optional)"
                    className="w-full p-2 border focus:outline-none bg-white font-sans text-neutral-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">CTA BUTTON LABEL</label>
                  <input
                    type="text"
                    value={formCta}
                    onChange={(e) => setFormCta(e.target.value)}
                    placeholder="e.g. Shop now"
                    className="w-full p-2 border focus:outline-none bg-white font-sans text-neutral-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Advanced Media Adjustments */}
            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-400 block tracking-wider mb-2">
                WHAT IMAGE IS BEING USED? / HOW WILL THAT IMAGE APPEAR?
              </span>
              <MediaManager 
                label={`${isNewDept ? 'New Department' : editingDept} Hero Background Image`}
                imageUrl={formImage}
                crop={formCrop}
                onImageChange={(url, adjustments) => {
                  setFormImage(url);
                  setFormCrop(adjustments?.crop);
                }}
                required
              />
            </div>

            {/* Step 2B: Multi-Image Slides & Auto Slide Controls */}
            <div className="border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-neutral-50 p-4 sm:p-5 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-amber-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-neutral-900 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      Step 2B: Multi-Image Slideshow &amp; Auto Slide (Sawirrada Slide-ka)
                    </span>
                    <span className="text-[10px] bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      {1 + formSlideImages.length} Sawir Ku Jira
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    Kudar sawir labaad ama kuwo dheeraad ah adigoo isticmaalaya <strong>File Upload (Kombiyuutarkaaga)</strong>, <strong>URL Link</strong>, ama <strong>Sawirro Diyaar ah</strong> si ay homepage-ka ugu noqdaan Slide toos u socda ama gacanta lagu wareejiyo.
                  </p>
                </div>

                {/* Auto Slide Toggle Switch */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 border-2 border-neutral-800 shadow-xs shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formAutoSlide}
                      onChange={(e) => setFormAutoSlide(e.target.checked)}
                      className="accent-neutral-900 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold uppercase text-neutral-900 flex items-center gap-1.5">
                      {formAutoSlide ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Auto Slide: Daaran (ON)
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Auto Slide: Damsan (OFF)
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Current Slides Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] uppercase font-bold text-neutral-800 tracking-wider">
                    Sawirrada Hadda Ku Jira Slide-ka ({1 + formSlideImages.length} Slides):
                  </label>
                  <span className="text-[10px] text-neutral-500 font-sans">
                    Waxaad tirtiri kartaa ama kala hor marin kartaa sawirrada
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Primary Slide (From Step 2) */}
                  <div className="relative border-2 border-neutral-900 bg-white p-2 flex flex-col justify-between shadow-xs">
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                      {formImage && formImage.trim() !== '' ? (
                        isVideoUrl(formImage) ? (
                          <video
                            src={formImage}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={formImage}
                            alt="Slide 1 (Asal)"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                          Media lama helin
                        </div>
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-neutral-900 text-white text-[9px] font-bold uppercase px-2 py-0.5 shadow-2xs flex items-center gap-1">
                        {isVideoUrl(formImage) ? '🎬 Video 1' : 'Slide 1 (Asal)'}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-neutral-800 truncate">
                      {isVideoUrl(formImage) ? 'Muuqaalka koowaad (Video)' : 'Sawirka koowaad ee ugu weyn'}
                    </div>
                    <span className="text-[9px] text-neutral-400 font-sans">
                      (Waxaa laga baddali karaa Step 2)
                    </span>
                  </div>

                  {/* Additional Slides */}
                  {formSlideImages.filter((url): url is string => Boolean(url && url.trim() !== '')).map((imgUrl, idx) => (
                    <div key={idx} className="relative border border-neutral-300 hover:border-neutral-900 bg-white p-2 flex flex-col justify-between group shadow-2xs transition-colors">
                      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                        {isVideoUrl(imgUrl) ? (
                          <video
                            src={imgUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={imgUrl}
                            alt={`Slide ${idx + 2}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 shadow-2xs flex items-center gap-1">
                          {isVideoUrl(imgUrl) ? `🎬 Video ${idx + 2}` : `Slide ${idx + 2}`}
                        </span>
                        
                        {/* Slide action buttons */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormSlideImages(prev => prev.filter((_, i) => i !== idx))}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md cursor-pointer transition-transform active:scale-90"
                            title="Tirtir kan"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className="text-[9px] font-medium text-neutral-600 truncate flex-1 font-mono">
                          {imgUrl.startsWith('data:video') ? 'Video La Soo Upload-gareeyay' : (imgUrl.startsWith('data:image') ? 'Sawir La Soo Upload-gareeyay' : imgUrl)}
                        </span>

                        {/* Reordering Controls */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              setFormSlideImages(prev => {
                                const copy = [...prev];
                                const temp = copy[idx];
                                copy[idx] = copy[idx - 1];
                                copy[idx - 1] = temp;
                                return copy;
                              });
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                            title="U wareeji bidix"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formSlideImages.length - 1}
                            onClick={() => {
                              setFormSlideImages(prev => {
                                const copy = [...prev];
                                const temp = copy[idx];
                                copy[idx] = copy[idx + 1];
                                copy[idx + 1] = temp;
                                return copy;
                              });
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                            title="U wareeji midig"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Slide - Multi-Source Section */}
              <div className="pt-4 border-t border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs uppercase font-bold text-neutral-900 tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-amber-600" />
                    + Kudar Sawir Labaad ama mid cusub (Dooro Habka aad doonto):
                  </span>

                  {/* Input Mode Tabs */}
                  <div className="flex gap-1 bg-neutral-100 p-1 border text-[10px] uppercase font-bold self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSlideActiveTab('upload')}
                      className={`px-3 py-1.5 flex items-center gap-1 transition-all cursor-pointer ${
                        slideActiveTab === 'upload' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Upload size={12} />
                      File Upload (Kombiyuutarka)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideActiveTab('url')}
                      className={`px-3 py-1.5 flex items-center gap-1 transition-all cursor-pointer ${
                        slideActiveTab === 'url' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <ImageIcon size={12} />
                      URL Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideActiveTab('presets')}
                      className={`px-3 py-1.5 flex items-center gap-1 transition-all cursor-pointer ${
                        slideActiveTab === 'presets' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Sparkles size={12} />
                      Sawirro Diyaar ah (Presets)
                    </button>
                  </div>
                </div>

                {slideUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{slideUploadError}</span>
                  </div>
                )}

                {/* TAB 1: File Upload (Drag-and-Drop + File Browser) */}
                {slideActiveTab === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingSlideFile(true);
                    }}
                    onDragLeave={() => setIsDraggingSlideFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingSlideFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleSlideFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => slideFileInputRef.current?.click()}
                    className={`p-6 sm:p-8 border-2 border-dashed text-center transition-all cursor-pointer relative bg-white ${
                      isDraggingSlideFile ? 'border-amber-600 bg-amber-50/60' : 'border-neutral-300 hover:border-neutral-800'
                    }`}
                  >
                    <input
                      ref={slideFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleSlideFiles(e.target.files);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs">
                        {isUploadingSlides ? <Loader2 size={20} className="animate-spin text-amber-600" /> : <Upload size={20} />}
                      </div>
                      <div className="text-sm font-bold text-neutral-900">
                        {isUploadingSlides ? 'Slides-ka waa la soo upload-gareynayaa (Uploading Media)...' : 'Riix halkan si aad sawir ama video kombiyuutarkaaga uga soo doorato ama soo jiid (Drag & Drop)'}
                      </div>
                      <p className="text-xs text-neutral-500 max-w-md">
                        {isUploadingSlides ? 'Fadlan dhowr ilbiriqsi sug inta slide-yada la keydinayo...' : 'Waxaad soo gelin kartaa sawirro ama videos (JPG, PNG, WEBP, MP4, WEBM, MOV ilaa 50MB).'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          slideFileInputRef.current?.click();
                        }}
                        className="mt-2 px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 shadow-xs cursor-pointer"
                      >
                        📂 Dooro Sawir / Video (Browse Computer)
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: URL Link */}
                {slideActiveTab === 'url' && (
                  <div className="bg-white p-4 border border-neutral-200 space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                      Paste Image or Video Web Address (Link-ga Sawirka ama Video-ga):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newSlideUrl}
                        onChange={(e) => setNewSlideUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSlideUrl.trim()) {
                              setFormSlideImages(prev => [...prev, newSlideUrl.trim()]);
                              setNewSlideUrl('');
                            }
                          }
                        }}
                        placeholder="Gali link-ga sawirka ama video-ga (e.g. https://.../video.mp4 ama image.jpg)"
                        className="flex-1 p-2.5 border border-neutral-300 focus:border-neutral-900 focus:outline-none bg-white font-sans text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSlideUrl.trim()) {
                            setFormSlideImages(prev => [...prev, newSlideUrl.trim()]);
                            setNewSlideUrl('');
                          }
                        }}
                        disabled={!newSlideUrl.trim()}
                        className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-40 hover:bg-neutral-800 transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        + Kudar Slide
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Ku qor ama soo koobiyee link-ga tooska ah ee sawirka ama muuqaalka (video) ka dibna riix <strong>+ Kudar Slide</strong>.
                    </p>
                  </div>
                )}

                {/* TAB 3: Presets Gallery */}
                {slideActiveTab === 'presets' && (
                  <div className="bg-white p-3 border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-600 uppercase block mb-2 tracking-wider">
                      Guji sawir ama video kasta oo diyaar ah si uu isla markiiba ugu biiro slide-ka:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        ...LUXURY_VIDEO_PRESETS.map(p => ({ name: p.name, url: p.url, isVideo: true })),
                        { name: 'Dior Studio Fashion', url: heroCampaignImg, isVideo: false },
                        { name: 'Beauty & Diamonds', url: beautyHeroImg, isVideo: false },
                        ...LUXURY_IMAGE_PRESETS.slice(0, 6).map(p => ({ name: p.name, url: p.url, isVideo: false }))
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormSlideImages(prev => [...prev, preset.url]);
                          }}
                          className="group p-2 border border-neutral-200 bg-neutral-50 hover:border-neutral-900 hover:bg-white transition-all text-left flex flex-col gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-neutral-200">
                            {preset.isVideo || isVideoUrl(preset.url) ? (
                              <video src={preset.url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            )}
                            <span className="absolute bottom-1 right-1 bg-neutral-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase">
                              + Kudar
                            </span>
                            {(preset.isVideo || isVideoUrl(preset.url)) && (
                              <span className="absolute top-1 left-1 bg-neutral-900/90 text-amber-400 text-[8px] font-bold px-1 py-0.2 uppercase flex items-center gap-0.5">
                                <Play size={8} className="fill-amber-400" /> Video
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-800 truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Interval Selection */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-neutral-800 mb-1">
                    Slide Speed / Interval (Xawaaraha u kala wareegidda):
                  </label>
                  <select
                    value={formSlideInterval}
                    onChange={(e) => setFormSlideInterval(Number(e.target.value))}
                    className="p-2 border border-neutral-300 bg-white text-xs font-sans focus:outline-none focus:border-neutral-900"
                  >
                    <option value={3}>3 Ilbiriqsi (Degdeg / 3s Fast)</option>
                    <option value={4}>4 Ilbiriqsi (4s Standard)</option>
                    <option value={5}>5 Ilbiriqsi (5s Recommended Luxury)</option>
                    <option value={7}>7 Ilbiriqsi (7s Deggan)</option>
                    <option value={10}>10 Ilbiriqsi (10s Aad u deggan)</option>
                  </select>
                </div>

                <div className="text-xs text-neutral-600 bg-white p-2.5 border border-neutral-200 sm:max-w-xs">
                  {formAutoSlide ? (
                    <p>
                      ✓ <strong>Auto Slide waa daaran yahay:</strong> Sawirku wuxuu si automatic ah u slide-garoobayaa <strong>{formSlideInterval} ilbiriqsi</strong> kasta marka qofku joogo homepage-ka.
                    </p>
                  ) : (
                    <p>
                      ○ <strong>Auto Slide waa dansan yahay:</strong> Qofku gacanta ayuu ku riixayaa badhamada slide-ka (manual controls).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Exact Image Crop & Live Vertical Drag Positioning */}
            <div className="border bg-neutral-50 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-800 block tracking-wider">
                    Step 3: Image Positioning &amp; Vertical Drag (Jiid Kor ama Hoos)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5">
                    Booska: {formFocalY}% {formZoom > 1 ? `• Zoom: ${formZoom.toFixed(1)}x` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 mb-3 leading-relaxed">
                  Sawirka toos ugu jiid mouse-ka kor ama hoos adigoo gujinaya sanduuqa preview-ka, ama isticmaal slider-ka iyo badhamada hoose si wejiga ama dharku si fiican ugu muuqdaan homepage-ka.
                </p>

                {/* Interactive Live Drag Viewport inside Form */}
                <div 
                  className="relative w-full h-52 sm:h-64 bg-black border-2 border-neutral-800 overflow-hidden cursor-grab active:cursor-grabbing select-none mb-3 shadow-inner group"
                  onMouseDown={(e) => {
                    setIsDraggingForm(true);
                    dragFormStartRef.current = { clientY: e.clientY, initialFocalY: formFocalY };
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      setIsDraggingForm(true);
                      dragFormStartRef.current = { clientY: e.touches[0].clientY, initialFocalY: formFocalY };
                    }
                  }}
                >
                  {formImage ? (
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-[object-position] duration-75"
                      style={{
                        objectPosition: `50% ${formFocalY}%`,
                        transform: formZoom > 1 ? `scale(${formZoom})` : undefined,
                        transformOrigin: `50% ${formFocalY}%`
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
                      Xulo sawir sare si aad halkan ugu aragto preview
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />

                  {/* Visual Guideline Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 font-bold flex items-center gap-1.5 border border-white/20 pointer-events-none shadow-sm">
                    <MoveVertical size={13} className="text-amber-400 animate-pulse" /> 
                    <span>Guji oo kor ama hoos u jiid (Drag up/down)</span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 bg-amber-600 text-white text-[10px] px-2 py-0.5 font-bold font-mono pointer-events-none shadow-sm">
                    {formFocalY}%
                  </div>

                  {/* Centered Preview Content matching real Homepage Split */}
                  <div className="absolute bottom-5 inset-x-0 text-center pointer-events-none px-4">
                    <h5 className="font-serif text-xl sm:text-2xl font-light text-white tracking-tight drop-shadow-md mb-1.5">
                      {formTitle || (isNewDept ? 'New Department' : editingDept)}
                    </h5>
                    <span className="text-[13px] text-white font-medium underline underline-offset-4 tracking-wider uppercase drop-shadow">
                      {formCta || 'Shop now'}
                    </span>
                  </div>
                </div>

                {/* Vertical Slider & Step Buttons */}
                <div className="bg-white p-3.5 border border-neutral-300 space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const nextY = Math.max(0, formFocalY - 5);
                        setFormFocalY(nextY);
                        setFormImagePosition(`object-[50%_${nextY}%]`);
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Kor u qaad sawirka si qaybta sare u muuqato"
                    >
                      <ChevronUp size={14} className="text-amber-600" /> Kor (-5%)
                    </button>
                    
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase hidden sm:inline">Kore (0%)</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={formFocalY} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormFocalY(val);
                          setFormImagePosition(`object-[50%_${val}%]`);
                        }}
                        className="flex-1 accent-amber-600 h-2 bg-neutral-200 rounded-none cursor-pointer"
                      />
                      <span className="text-[9px] font-bold text-neutral-400 uppercase hidden sm:inline">Hoose (100%)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextY = Math.min(100, formFocalY + 5);
                        setFormFocalY(nextY);
                        setFormImagePosition(`object-[50%_${nextY}%]`);
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Hoos u dhig sawirka si qaybta hoose u muuqato"
                    >
                      <ChevronDown size={14} className="text-amber-600" /> Hoos (+5%)
                    </button>
                  </div>

                  {/* Quick Presets & Zoom Control */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 mr-1">Doorasho Degdeg ah:</span>
                      {[
                        { label: '👤 Wejiga / Madaxa', val: 18, desc: 'Sare (18%)' },
                        { label: '👔 Laabta / Dharka', val: 35, desc: 'Dhexdhexaad (35%)' },
                        { label: '🎯 Bartamaha', val: 50, desc: 'Dhexe (50%)' },
                        { label: '👗 Qaybta Hoose', val: 75, desc: 'Hoose (75%)' }
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setFormFocalY(preset.val);
                            setFormImagePosition(`object-[50%_${preset.val}%]`);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                            formFocalY === preset.val 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-neutral-200">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase px-1">Zoom:</span>
                      <button
                        type="button"
                        onClick={() => setFormZoom(prev => Math.max(1.0, Number((prev - 0.1).toFixed(1))))}
                        className="px-1.5 py-0.5 bg-white border border-neutral-300 text-[10px] font-bold hover:bg-neutral-200"
                        title="Zoom Out"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono font-bold px-1 text-neutral-800">{formZoom.toFixed(1)}x</span>
                      <button
                        type="button"
                        onClick={() => setFormZoom(prev => Math.min(2.0, Number((prev + 0.1).toFixed(1))))}
                        className="px-1.5 py-0.5 bg-white border border-neutral-300 text-[10px] font-bold hover:bg-neutral-200"
                        title="Zoom In"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-700 block tracking-wider mb-2">
                  Step 4: Dark Overlay Intensity (Mugdiga dusha sawirka saaran)
                </span>
                <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
                  Hoos u dhig ama kordhi mugdiga dusha sawirka saaran si uu qoraalku (white text) ugu muuqdo mid si fudud loo akhrin karo.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'light', label: 'Light (20%)', desc: 'Mugdi aad u yar' },
                    { id: 'medium', label: 'Medium (35%)', desc: 'Heerka caadiga' },
                    { id: 'default', label: 'Dark (50%)', desc: 'Mugdi dhexdhexaad' },
                    { id: 'dark', label: 'Extra Dark (70%)', desc: 'Mugdiga ugu badan' }
                  ].map((over) => (
                    <button
                      key={over.id}
                      type="button"
                      onClick={() => setFormOverlayOpacity(over.id)}
                      className={`p-2.5 border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        formOverlayOpacity === over.id 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                      }`}
                    >
                      <span className="font-bold text-[11px] block">{over.label}</span>
                      <span className={`text-[9px] block mt-1 ${formOverlayOpacity === over.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {over.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-700 block tracking-wider mb-2">
                  Step 5: Visibility State (Muuqaalka Website-ka)
                </span>
                <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
                  Halkan ka maamul haddii aad rabto in qaybtani ay ka muuqato homepage-ka iyo website-ka iyo haddii kale. Haddii aad qariso (Inactive/Tirtiray), kama muuqan doonto homepage-ka.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    key="active-state"
                    type="button"
                    onClick={() => setFormActive(true)}
                    className={`px-4 py-2 border text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      formActive 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' 
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Active (La Muujiyay)
                  </button>
                  <button
                    key="inactive-state"
                    type="button"
                    onClick={() => setFormActive(false)}
                    className={`px-4 py-2 border text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      !formActive 
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold' 
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Inactive (La Qariyay / Tirtiray)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t justify-end">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                disabled={isSaving}
                className="px-5 py-2.5 border text-neutral-700 uppercase font-bold text-xs hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-neutral-900 text-white uppercase font-bold text-xs hover:bg-neutral-800 flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-400" />
                    <span>Waa la kaydinayaa (Saving)...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Placement &amp; Copy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* OVERVIEW DASHBOARD DEPARTMENTS GRID */
        <div className="grid md:grid-cols-2 gap-6">
          {departments.map((dept, index) => (
            <div key={`${dept.id}-${index}`} className="border border-neutral-200 bg-white shadow-xs p-5 space-y-4 hover:border-neutral-400 transition-all relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start pb-2 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-amber-600 tracking-wider">
                        {dept.isCustom ? 'CUSTOM DEPT LEVEL I' : 'SYSTEM DEPT LEVEL I'}
                      </span>
                      {dept.slideImages && dept.slideImages.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-xs shadow-2xs">
                          <Sparkles size={10} />
                          {dept.slideImages.length + 1} Slides {dept.autoSlide !== false ? '• Auto' : '• Manual'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-serif font-bold text-neutral-900">{dept.name}</h4>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5">
                    {dept.isCustom ? 'Custom' : dept.id}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mt-2 leading-relaxed min-h-[40px]">
                  {dept.description}
                </p>

                {/* Statistics panel */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 mt-3 border text-neutral-700">
                  <div className="flex items-center gap-1.5">
                    <Folder size={14} className="text-amber-500" />
                    <span className="text-xs">
                      Categories: <strong>{dept.categoryCount}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-amber-500" />
                    <span className="text-xs">
                      Products: <strong>{dept.productCount}</strong>
                    </span>
                  </div>
                </div>

                {/* Hero preview box */}
                <div className="relative aspect-video w-full mt-3 overflow-hidden bg-neutral-100 border">
                  {dept.heroImage ? (
                    isVideoUrl(dept.heroImage) ? (
                      <video
                        src={dept.heroImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={dept.heroImage}
                        alt={dept.name}
                        style={{
                          objectPosition: dept.crop?.focalY !== undefined 
                            ? `${dept.crop.focalX ?? 50}% ${dept.crop.focalY}%` 
                            : (dept.imagePosition && dept.imagePosition !== 'object-center' && dept.imagePosition !== 'object-[50%_35%]' ? (dept.imagePosition === 'object-top' ? 'top' : dept.imagePosition.replace('object-', '')) : '50% 18%'),
                          transform: dept.crop?.zoom && dept.crop.zoom > 1 ? `scale(${dept.crop.zoom})` : undefined,
                          transformOrigin: dept.crop ? `${dept.crop.focalX ?? 50}% ${dept.crop.focalY ?? 20}%` : '50% 18%',
                        }}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-400 text-xs font-serif">
                      {dept.title || dept.name}
                    </div>
                  )}
                  {dept.heroImage && isVideoUrl(dept.heroImage) && (
                    <span className="absolute top-2 left-2 bg-neutral-900/90 text-amber-400 border border-amber-400/40 text-[9px] font-bold uppercase px-2 py-0.5 tracking-wider flex items-center gap-1 shadow-md z-10">
                      <Play size={10} className="fill-amber-400" /> Video Hero
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2.5 text-white pointer-events-none">
                    <h5 className="text-xs font-serif font-bold leading-tight">{dept.title}</h5>
                  </div>
                </div>

                {/* Active placements list */}
                <div className="mt-3 flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 mr-1.5 flex items-center gap-0.5">
                    <LayoutGrid size={11} /> Placements:
                  </span>
                  {dept.placements.map(p => (
                    <span key={p} className="text-[9px] font-bold bg-neutral-100 text-neutral-700 border px-1.5 py-0.5 rounded-none uppercase">
                      {p}
                    </span>
                  ))}
                </div>

                {/* NESTED CATEGORIES DIRECTORY FOR THIS DEPARTMENT */}
                <div className="mt-4 pt-3 border-t border-neutral-100 bg-neutral-50/70 -mx-4 -mb-4 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder size={13} className="text-amber-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                        Categories in {dept.name} ({
                          (categories || []).filter(c => {
                            const cDept = (c.department || '').toLowerCase();
                            const dId = dept.id.replace('dept-banner-', '').toLowerCase();
                            return cDept === dId || (dId === 'fashion' && (cDept === 'couture' || cDept === 'ready-to-wear' || cDept === 'fashion & accessories')) || (dId === 'beauty' && (cDept === 'fragrance' || cDept === 'beauty & fragrance'));
                          }).length
                        })
                      </span>
                    </div>

                    {onOpenCategoryWizard && (
                      <button
                        type="button"
                        onClick={() => onOpenCategoryWizard(dept.id.replace('dept-banner-', ''))}
                        className="px-2.5 py-1 bg-neutral-900 text-white hover:bg-amber-600 text-[9.5px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Plus size={11} /> + Add Category
                      </button>
                    )}
                  </div>

                  {/* Categories Grid inside Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(categories || [])
                      .filter(c => {
                        const cDept = (c.department || '').toLowerCase();
                        const dId = dept.id.replace('dept-banner-', '').toLowerCase();
                        return cDept === dId || (dId === 'fashion' && (cDept === 'couture' || cDept === 'ready-to-wear' || cDept === 'fashion & accessories')) || (dId === 'beauty' && (cDept === 'fragrance' || cDept === 'beauty & fragrance'));
                      })
                      .map((cat, catIdx) => {
                        const catProdCount = (products || []).filter(p => {
                          const pCat = (p.category || '').toLowerCase();
                          const cName = (cat.name || '').toLowerCase();
                          return pCat === cName || pCat === (cat.id || '').toLowerCase();
                        }).length;

                        return (
                          <div 
                            key={cat.id ? `${cat.id}-${catIdx}` : `cat-${catIdx}`}
                            className="flex items-center justify-between p-2 bg-white border border-neutral-200/80 hover:border-neutral-400 transition-all shadow-2xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {cat.image ? (
                                <img 
                                  src={cat.image} 
                                  alt={cat.name} 
                                  className="w-9 h-9 object-cover rounded-xs shrink-0 border border-neutral-200" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-neutral-200 rounded-xs flex items-center justify-center text-[10px] text-neutral-500 font-bold shrink-0">
                                  {cat.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h6 className="font-bold text-neutral-900 text-[11px] truncate leading-tight">{cat.name}</h6>
                                <p className="text-[9px] text-neutral-400 font-mono truncate">
                                  {catProdCount} items • {cat.subCategories ? cat.subCategories.length : 0} subcats
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onEditCategoryWizard && (
                                <button
                                  type="button"
                                  onClick={() => onEditCategoryWizard(cat)}
                                  className="p-1 text-neutral-500 hover:text-amber-700 hover:bg-neutral-100 rounded-xs transition-colors cursor-pointer"
                                  title="Edit category"
                                >
                                  <Edit3 size={12} />
                                </button>
                              )}
                              {onDeleteCategory && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCategory(cat.id, cat.name)}
                                  className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t mt-4 flex justify-between items-center">
                {dept.isActive !== false ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <Eye size={12} className="text-emerald-500" /> Live on Customer Site
                  </span>
                ) : (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <EyeOff size={12} className="text-red-500" /> Hidden / Deleted on Homepage
                  </span>
                )}
                <div className="flex gap-1.5">
                  {dept.isActive !== false ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(dept.id)}
                      className="px-2.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                      title="Deactivate / Delete from Homepage"
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : (
                    (!dept.isCustom) && (
                      <button
                        type="button"
                        onClick={() => handleActivateDepartment(dept.id)}
                        className="px-2.5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center justify-center cursor-pointer"
                        title="Restore / Activate on Homepage"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => openRepositionModal(dept)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Toosi ama jiid sawirka kor ama hoos"
                  >
                    <MoveVertical size={13} /> Jiid / Toosi (Reposition)
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(dept)}
                    className="px-4 py-2 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-wider hover:bg-amber-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={12} /> Configure &amp; Layout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Reset Girl Images Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-serif font-bold text-neutral-900">Ma hubtaa inaad dib u soo celiso sawirrada?</h4>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Tani waxay meesha ka saaraysaa sawirrada la beddelay ee Fashion-ka iyo Beauty-ga, waxayna soo celinaysaa sawirradii asalka ahaa ee gabdhaha.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 border text-neutral-700 text-xs uppercase font-bold tracking-wider hover:bg-neutral-50"
              >
                Haa, Iska daa
              </button>
              <button
                type="button"
                onClick={handleResetToDefaultImages}
                className="px-5 py-2 bg-neutral-900 text-white text-xs uppercase font-bold tracking-wider hover:bg-neutral-800"
              >
                Haa, soo celi sawirradii gabdhaha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Department Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-serif font-bold text-red-600">
              {confirmDeleteId === 'Fashion' || confirmDeleteId === 'Beauty' 
                ? 'Ma hubtaa inaad rabto inaad qariso/tirtirto qaybtan?' 
                : 'Ma hubtaa inaad rabto inaad tirtirto waaxdan?'}
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {confirmDeleteId === 'Fashion' || confirmDeleteId === 'Beauty'
                ? 'Habkani wuxuu si ku meel gaar ah u qarinayaa ama u tirtirayaa qaybtan dusha sare ee homepage-ka. Waad dib u soo celin kartaa (activate) wakhti kasta oo aad rabto.'
                : 'Tirtirista waaxdan custom-ka ah waxay gabi ahaanba ka saari doontaa website-ka iyo homepage-ka. Habkani dib looma soo celin karo.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border text-neutral-700 text-xs uppercase font-bold tracking-wider hover:bg-neutral-50 cursor-pointer"
              >
                Haddaba iska daa
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDepartment(confirmDeleteId)}
                className="px-5 py-2 bg-red-600 text-white text-xs uppercase font-bold tracking-wider hover:bg-red-700 cursor-pointer"
              >
                {confirmDeleteId === 'Fashion' || confirmDeleteId === 'Beauty' ? 'Haa, qari/tirtir' : 'Haa, tirtir waaxda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Quick Drag / Reposition Modal */}
      {repositionDept && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4">
          <div className="bg-white border border-neutral-300 max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <MoveVertical size={16} />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-neutral-900 leading-tight">
                    Toosi &amp; Jiid Sawirka (Drag Reposition)
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    {repositionDept.title || repositionDept.name} • Homepage Framing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRepositionDept(null)}
                className="text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer"
                title="Xir"
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive Drag & Preview Frame */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                  Live Viewport (Toos u jiid kor ama hoos)
                </span>
                <span className="text-[11px] font-mono font-bold bg-amber-600 text-white px-2.5 py-0.5 shadow-2xs">
                  Booska: {modalFocalY}% {modalZoom > 1 ? `• Zoom: ${modalZoom.toFixed(1)}x` : ''}
                </span>
              </div>

              <div 
                className="relative w-full aspect-16/10 sm:h-72 bg-black border-2 border-neutral-900 overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-md group"
                onMouseDown={(e) => {
                  setIsDraggingModal(true);
                  dragModalStartRef.current = { clientY: e.clientY, initialFocalY: modalFocalY };
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    setIsDraggingModal(true);
                    dragModalStartRef.current = { clientY: e.touches[0].clientY, initialFocalY: modalFocalY };
                  }
                }}
              >
                {repositionDept.heroImage ? (
                  isVideoUrl(repositionDept.heroImage) ? (
                    <video
                      src={repositionDept.heroImage}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-[object-position] duration-75"
                      style={{
                        objectPosition: `50% ${modalFocalY}%`,
                        transform: modalZoom > 1 ? `scale(${modalZoom})` : undefined,
                        transformOrigin: `50% ${modalFocalY}%`
                      }}
                    />
                  ) : (
                    <img 
                      src={repositionDept.heroImage} 
                      alt={repositionDept.name} 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-[object-position] duration-75"
                      style={{
                        objectPosition: `50% ${modalFocalY}%`,
                        transform: modalZoom > 1 ? `scale(${modalZoom})` : undefined,
                        transformOrigin: `50% ${modalFocalY}%`
                      }}
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : null}
                
                {/* Subtle dark gradient mirroring real homepage */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />

                {/* Floating hint pill */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 font-bold flex items-center gap-1.5 border border-white/20 pointer-events-none shadow-sm">
                  <MoveVertical size={13} className="text-amber-400 animate-pulse" /> 
                  <span>Guji oo kor/hoos u jiid (Drag up/down)</span>
                </div>

                {/* Real-time typography overlay mirroring customer homepage */}
                <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none px-4">
                  <h5 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-tight drop-shadow-lg mb-2">
                    {repositionDept.title || repositionDept.name}
                  </h5>
                  <span className="text-[13px] text-white font-medium underline underline-offset-4 tracking-wider uppercase drop-shadow">
                    {repositionDept.ctaText || 'Shop now'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slider and Quick Control Tools */}
            <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3.5">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalFocalY(prev => Math.max(0, prev - 5))}
                  className="px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                  title="Kor u qaad sawirka"
                >
                  <ChevronUp size={15} className="text-amber-600" /> Kor (-5%)
                </button>
                
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase hidden sm:inline">Kore (0%)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={modalFocalY} 
                    onChange={(e) => setModalFocalY(Number(e.target.value))}
                    className="flex-1 accent-amber-600 h-2 bg-neutral-200 rounded-none cursor-pointer"
                  />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase hidden sm:inline">Hoose (100%)</span>
                </div>

                <button
                  type="button"
                  onClick={() => setModalFocalY(prev => Math.min(100, prev + 5))}
                  className="px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                  title="Hoos u dhig sawirka"
                >
                  <ChevronDown size={15} className="text-amber-600" /> Hoos (+5%)
                </button>
              </div>

              {/* Quick Presets & Zoom Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 mr-1">Doorasho Fudud:</span>
                  {[
                    { label: '👤 Wejiga / Madaxa', val: 18 },
                    { label: '👔 Laabta / Suudhka', val: 35 },
                    { label: '🎯 Bartamaha', val: 50 },
                    { label: '👗 Dharka / Hoose', val: 75 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setModalFocalY(preset.val)}
                      className={`px-2.5 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                        modalFocalY === preset.val 
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                          : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-white p-1 border border-neutral-300">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase px-1">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setModalZoom(prev => Math.max(1.0, Number((prev - 0.1).toFixed(1))))}
                    className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-bold hover:bg-neutral-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1 text-neutral-800">{modalZoom.toFixed(1)}x</span>
                  <button
                    type="button"
                    onClick={() => setModalZoom(prev => Math.min(2.0, Number((prev + 0.1).toFixed(1))))}
                    className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-bold hover:bg-neutral-200 cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setRepositionDept(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs uppercase font-bold tracking-wider hover:bg-neutral-50 cursor-pointer"
                disabled={isSavingReposition}
              >
                Ka Noqo
              </button>
              <button
                type="button"
                onClick={handleSaveReposition}
                disabled={isSavingReposition}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs uppercase font-bold tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                {isSavingReposition ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Waa la kaydinayaa...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Badbaadi Booska Cusub (Save)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
