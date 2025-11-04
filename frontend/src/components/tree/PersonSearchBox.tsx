import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';

interface PersonSearchBoxProps {
  nodes: ExtendedTreeNode[];
  onSelect: (personId: string) => void;
  className?: string;
}

export default function PersonSearchBox({ nodes, onSelect, className = '' }: PersonSearchBoxProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter nodes based on search query
  const searchResults = query.trim()
    ? nodes.filter(node => {
        const q = query.toLowerCase();
        return (
          node.fullName.toLowerCase().includes(q) ||
          node.givenName?.toLowerCase().includes(q) ||
          node.surname?.toLowerCase().includes(q) ||
          node.maidenName?.toLowerCase().includes(q)
        );
      }).slice(0, 10) // Limit to 10 results
    : [];

  // Handle selection
  const handleSelect = (personId: string) => {
    onSelect(personId);
    setQuery('');
    setShowResults(false);
    setSelectedIndex(0);
    inputRef.current?.blur();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('tree.search.placeholder', 'Search people...')}
          className="w-full px-3 py-1.5 pl-8 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {searchResults.map((node, index) => (
            <button
              key={node.id}
              onClick={() => handleSelect(node.id)}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 transition ${
                index === selectedIndex ? 'bg-indigo-100' : ''
              }`}
            >
              <div className="font-semibold text-gray-900">{node.fullName}</div>
              <div className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {node.generation}
                </span>
                {node.birthDate && (
                  <span>
                    {node.isAlive ? '🟢' : '⚫'}{' '}
                    {new Date(node.birthDate).getFullYear()}
                  </span>
                )}
                {node.isBridge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    🌉 Bridge
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && query.trim() && searchResults.length === 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-center text-xs text-gray-500"
        >
          {t('tree.search.noResults', 'No people found')}
        </div>
      )}
    </div>
  );
}
