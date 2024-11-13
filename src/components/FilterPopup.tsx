import React from 'react';

interface FilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  selectedItems: string[];
  onItemSelect: (item: string) => void;
  title: string;
}

export default function FilterPopup({ isOpen, onClose, items, selectedItems, onItemSelect, title }: FilterPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div className="p-2">
        <div className="mb-2 px-2 text-sm font-medium text-gray-700">{title}</div>
        <div className="max-h-60 overflow-auto">
          {items.map((item) => (
            <label key={item} className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => onItemSelect(item)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}