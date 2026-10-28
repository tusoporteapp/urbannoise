import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS_DATA, formatCOP } from '../data/products';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  products = PRODUCTS_DATA,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalize = (str: string) =>
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const cleanQuery = normalize(query.trim());

  const filtered = cleanQuery
    ? products.filter(
        (p) =>
          (p.stock || 0) > 0 &&
          p.isPublished !== false &&
          (normalize(p.name).includes(cleanQuery) ||
            (p.sku && normalize(p.sku).includes(cleanQuery)) ||
            normalize(p.desc).includes(cleanQuery))
      )
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      onSelectProduct(filtered[0]);
      onClose();
    }
  };

  return (
    <div
      id="search-modal"
      className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-24 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-xl w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:opacity-60 transition cursor-pointer"
          aria-label="Cerrar búsqueda"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#101013] mb-4">
          BUSCAR EN URBANNOISE
        </h3>

        <div className="flex items-center border-b-2 border-[#101013] pb-2 mb-4">
          <Search className="w-4 h-4 text-gray-500 mr-2 flex-none" />
          <input
            ref={inputRef}
            id="search-input"
            name="search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe camiseta, hoodie, dama, weird..."
            className="w-full text-base font-medium focus:outline-none uppercase"
          />
        </div>

        <div id="search-results" className="max-h-72 overflow-y-auto space-y-2 text-xs font-medium overscroll-contain">
          {!query.trim() ? (
            <p className="text-gray-400 py-4 text-center">
              Escribe algo para ver resultados inmediatos...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">
              No encontramos prendas que coincidan con &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 cursor-pointer transition rounded"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-10 h-12 object-cover bg-gray-200 flex-none"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#101013] truncate uppercase">{p.name}</p>
                  <p className="text-xs text-gray-500">{formatCOP(p.price)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
