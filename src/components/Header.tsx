import { useState, useEffect } from 'react';
import { Menu, X, Sun, Heart, Star, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Accueil', href: '/' },
    { name: 'À Propos', href: '/about' },
    { name: 'Nos Sections', href: '/sections' },
    { name: 'Galerie', href: '/gallery' },
    { name: 'Actualités', href: '/news' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-accent backdrop-blur-sm border-accent/20 shadow-soft' 
        : 'bg-transparent backdrop-blur-sm'
    }`}>
      <div className="container-custom section-padding py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="w-16 sm:w-20" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`transition-colors duration-300 font-medium relative group ${
                  isScrolled ? 'text-white hover:text-secondary' : 'text-white hover:text-secondary'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? 'bg-secondary' : 'bg-secondary'
                }`}></span>
              </a>
            ))}
          </nav>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button className="btn-primary hidden sm:flex items-center space-x-2">
              <span>Rejoignez-nous</span>
            </Button>
            
            <Button 
              className="btn-accent hidden sm:flex items-center space-x-2"
              onClick={() => window.location.href = '/admin/login'}
            >
              <span>Espace Admin</span>
            </Button>
            
            <Button className="btn-accent sm:hidden">
              <Phone className="w-4 h-4 text-white" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`lg:hidden mt-4 pb-4 border-t ${
            isScrolled ? 'border-white/20' : 'border-white/20'
          }`}>
            <nav className="flex flex-col space-y-3 pt-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`transition-colors duration-300 font-medium py-2 ${
                    isScrolled ? 'text-white hover:text-secondary' : 'text-white hover:text-secondary'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <Button className="btn-primary mt-4 w-full">
                Rejoignez-nous
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;