"use client";

import { useState, useRef, useEffect } from 'react';
import { IconMapPin, IconChevronDown, IconSearch } from '@tabler/icons-react';
import { coutygeoId } from '../utils/countyCatalog';

interface Props {
  value: string;
  onChange: (countyId: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface County {
  id: string;
  name: string;
}

export default function CountySelector({ value, onChange, placeholder = "Search for a county...", required = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCounties, setFilteredCounties] = useState<County[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert county catalog to searchable array
  const counties: County[] = Object.entries(coutygeoId).map(([id, name]) => ({
    id,
    name
  }));

  // Get selected county name
  const selectedCountyName = value ? coutygeoId[value as keyof typeof coutygeoId] || value : '';

  // Filter counties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCounties(counties.slice(0, 100)); // Show first 100 counties by default
    } else {
      const filtered = counties.filter(county =>
        county.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        county.id.includes(searchTerm)
      ).slice(0, 50); // Limit to 50 results for performance
      setFilteredCounties(filtered);
    }
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (countyId: string) => {
    onChange(countyId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
        <IconMapPin className="w-4 h-4" />
        County
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedCountyName}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-700"
          required={required}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          {isOpen ? (
            <IconSearch className="w-4 h-4 text-slate-400" />
          ) : (
            <IconChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCounties.length > 0 ? (
            <div className="py-1">
              {filteredCounties.map((county) => (
                <button
                  key={county.id}
                  type="button"
                  onClick={() => handleSelect(county.id)}
                  className="w-full px-4 py-2 text-left hover:bg-purple-50 hover:text-purple-700 transition-colors focus:bg-purple-50 focus:text-purple-700 focus:outline-none text-gray-800"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{county.name}</span>
                    <span className="text-xs text-slate-500">{county.id}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              {searchTerm ? `No counties found for "${searchTerm}"` : 'Start typing to search counties...'}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-1">
        Search by county name or ID. {filteredCounties.length > 0 && `Showing ${Math.min(filteredCounties.length, isOpen ? filteredCounties.length : 0)} results.`}
      </p>
    </div>
  );
}
