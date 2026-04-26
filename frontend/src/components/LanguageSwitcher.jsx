import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="language-switcher-container" ref={dropdownRef}>
      <button 
        className="lang-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Languages size={18} />
        <span className="hide-mobile">{currentLanguage.native}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <div className="lang-info">
                <span className="lang-native">{lang.native}</span>
                <span className="lang-label">{lang.label}</span>
              </div>
              {i18n.language === lang.code && <Check size={16} />}
            </button>
          ))}
        </div>
      )}

      <style jsx="true">{`
        .language-switcher-container {
          position: relative;
          z-index: 1000;
        }

        .lang-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #e8f5e9);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .lang-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary-color, #2d7a3a);
        }

        .chevron {
          transition: transform 0.2s ease;
          opacity: 0.6;
        }

        .chevron.rotate {
          transform: rotate(180deg);
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #1a241a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          min-width: 160px;
          overflow: hidden;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lang-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: #a5d6a7;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .lang-option:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .lang-option.active {
          background: rgba(45, 122, 58, 0.15);
          color: #4caf50;
        }

        .lang-info {
          display: flex;
          flex-direction: column;
        }

        .lang-native {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .lang-label {
          font-size: 0.75rem;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
