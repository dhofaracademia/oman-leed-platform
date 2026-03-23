import { useState, useEffect } from 'react';
import { Menu, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onNavigate: (section: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
  ];

  const handleNavClick = (section: string) => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a5d3c] to-[#d4af37] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className={`font-bold text-xl transition-colors ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`}>
              UrbanEX
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative group ${
                  isScrolled
                    ? 'text-slate-600 hover:text-[#1a5d3c] hover:bg-[#1a5d3c]/5'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{link.label}</span>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-1/2 ${
                  isScrolled ? 'bg-[#1a5d3c]' : 'bg-white'
                }`} />
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={() => handleNavClick('analysis')}
              className="bg-[#1a5d3c] hover:bg-[#143d29] text-white px-6"
            >
              Analyze Land
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="w-full px-4 py-3 rounded-lg text-left text-slate-700 hover:bg-[#1a5d3c]/5 hover:text-[#1a5d3c] transition-colors"
            >
              <span className="font-medium">{link.label}</span>
            </button>
          ))}
          <Button
            onClick={() => handleNavClick('analysis')}
            className="w-full bg-[#1a5d3c] hover:bg-[#143d29] text-white mt-4"
          >
            Analyze Land
          </Button>
        </div>
      </div>
    </nav>
  );
}
