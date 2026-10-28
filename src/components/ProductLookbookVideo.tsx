import React from 'react';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../lib/videoUtils';

interface ProductLookbookVideoProps {
  url: string;
  title?: string;
  className?: string;
  fit?: 'contain' | 'cover';
}

export const ProductLookbookVideo: React.FC<ProductLookbookVideoProps> = ({
  url,
  title = 'Motion Lookbook',
  className = '',
  fit = 'contain',
}) => {
  if (!url) return null;

  // Si la URL es el video de YouTube conocido de URBANNOISE (P2I08GGbqkk),
  // se reemplaza automáticamente por su versión nativa MP4 de alta velocidad alojada en el repositorio.
  let videoSrc = url;
  if (url.includes('P2I08GGbqkk')) {
    videoSrc = 'https://cdn.jsdelivr.net/gh/tusoporteapp/urbannoise@master/images/products/11565/lookbook.mp4';
  }

  const isYT = isYouTubeUrl(videoSrc);

  // ==============================================================
  // 1. REPRODUCTOR NATIVO MP4 / WEBM (Recomendado y 100% Limpio)
  // - Reproduce solo automáticamente (autoPlay)
  // - Bucle continuo infinito (loop) sin pausas ni botón de replay
  // - Ajustado al recuadro sin cortes (object-contain)
  // - Cero botones, cero marcas externas
  // ==============================================================
  if (!isYT) {
    return (
      <div className={`relative w-full h-full bg-[#0A0A0C] overflow-hidden flex items-center justify-center ${className}`}>
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} object-center bg-[#0A0A0C]`}
        />
      </div>
    );
  }

  // ==============================================================
  // 2. FALLBACK PARA YOUTUBE (Ajustado al marco con loop)
  // ==============================================================
  const embedUrl = getYouTubeEmbedUrl(videoSrc, true, true);

  return (
    <div className={`relative w-full h-full bg-[#0A0A0C] overflow-hidden flex items-center justify-center ${className}`}>
      <iframe
        src={embedUrl || ''}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      />
    </div>
  );
};
