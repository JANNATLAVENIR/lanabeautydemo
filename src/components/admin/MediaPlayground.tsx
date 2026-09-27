import React, { useState } from 'react';
import { Sparkles, Eye, Image as ImageIcon, Copy, Check, Layout, Code, Monitor, Smartphone } from 'lucide-react';
import defaultFashionStudioImg from '../../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import { MediaManager, ImageAdjustments } from './MediaManager';

export function MediaPlayground() {
  const [imageUrl, setImageUrl] = useState(defaultFashionStudioImg);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    fit: 'cover',
    aspectRatio: '3:4',
    focalPoint: { x: 50, y: 50 }
  });
  const [copied, setCopied] = useState(false);

  const handleImageChange = (url: string, adj?: ImageAdjustments) => {
    setImageUrl(url);
    if (adj) {
      setAdjustments(adj);
    }
  };

  const getTailwindClass = () => {
    const aspect = adjustments.aspectRatio.replace(':', '/');
    return `relative overflow-hidden aspect-${aspect} object-${adjustments.fit}`;
  };

  const getStyleProperty = () => {
    return `object-fit: ${adjustments.fit}; object-position: ${adjustments.focalPoint.x}% ${adjustments.focalPoint.y}%;`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-100">
        <h3 className="text-xl font-serif text-neutral-900 font-normal">Media Playground & Aspect-Ratio Tuning</h3>
        <p className="text-xs text-neutral-500">
          Upload or link arbitrary assets and tweak how they crop, scale, and center across modern viewport form factors.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Side: Media Manager */}
        <div className="lg:col-span-8">
          <MediaManager
            label="Media Asset Under Audit"
            imageUrl={imageUrl}
            onImageChange={handleImageChange}
          />
        </div>

        {/* Right Side: Showcase Code & Quick Explanatory Tips */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs text-neutral-800 space-y-3">
            <h5 className="font-bold uppercase tracking-wider text-[10px] text-neutral-700 flex items-center gap-1.5 border-b pb-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>Focal Point Geometry</span>
            </h5>
            <p className="leading-relaxed">
              When e-commerce sites display background banners, portrait cards, or full-screen grids, the client’s browser window size changes constantly.
            </p>
            <p className="leading-relaxed">
              Standard image uploads often cut off critical product portions (like a model’s face or bottle caps). By defining a <strong>Focal Point</strong>, your inline styles anchor around those coordinates, ensuring the perfect crop.
            </p>
          </div>

          <div className="bg-neutral-900 text-neutral-400 p-4 border text-xs space-y-3 font-mono">
            <h5 className="text-white font-bold text-[10px] uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex items-center justify-between">
              <span>Code Snippets Generator</span>
              <button
                type="button"
                onClick={() => handleCopy(getStyleProperty())}
                className="text-amber-500 hover:text-white transition-colors cursor-pointer text-[9px] uppercase font-bold flex items-center gap-1"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </h5>

            <div className="space-y-2">
              <div>
                <span className="text-amber-500 font-sans font-bold block text-[9px] uppercase tracking-wider">
                  Tailwind CSS Classes
                </span>
                <p className="text-white bg-neutral-950 p-2 border border-neutral-800 select-all font-mono break-all text-[10px]">
                  {getTailwindClass()}
                </p>
              </div>

              <div>
                <span className="text-amber-500 font-sans font-bold block text-[9px] uppercase tracking-wider">
                  React Inline Styles Props
                </span>
                <p className="text-white bg-neutral-950 p-2 border border-neutral-800 select-all font-mono break-all text-[10px]">
                  {`{ objectFit: '${adjustments.fit}', objectPosition: '${adjustments.focalPoint.x}% ${adjustments.focalPoint.y}%' }`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
