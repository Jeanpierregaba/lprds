import { useState, useEffect } from 'react';
import { Menu, X, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-accent backdrop-blur-sm border-accent/20 shadow-soft'
          : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container-custom section-padding py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a href="/">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="w-16 sm:w-20" />
            </div>
          </a>


          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`transition-colors duration-300 font-medium relative group ${
                  isScrolled
                    ? 'text-white hover:text-secondary'
                    : 'text-white hover:text-secondary'
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    isScrolled ? 'bg-secondary' : 'bg-secondary'
                  }`}
                ></span>
              </a>
            ))}
          </nav>

          {/* CTA Buttons & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Boutons visibles seulement sur desktop */}
            <div className="hidden sm:flex items-center space-x-4">
              <Button variant="outline" className="bg-primary text-white px-8 py-4 rounded-full">
                  <a 
                    href="https://wa.me/22890554121"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rejoignez-nous
                  </a>
              </Button>

              <Button
                variant="outline"
                className="border-primary text-primary px-8 py-4 rounded-full"
                onClick={() => (window.location.href = '/login')}
              >
                <span>Espace Parent</span>
              </Button>
            </div>

            {/* Icône téléphone (mobile uniquement) */}
            <Button className="btn-accent sm:hidden">
            <a 
                    href="https://wa.me/22890554121"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone className="w-4 h-4 text-white" />
                  </a>
              
            </Button>

            <Button className="btn-secondary bg-white sm:hidden"
              onClick={() => (window.location.href = '/admin/login')}
            >
              <User className="w-4 h-4 text-primary" />
            </Button>



            {/* Bouton menu mobile */}
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

        {/* Menu mobile */}
        {isMenuOpen && (
          <div
            className={`lg:hidden mt-4 pb-4 border-t ${
              isScrolled ? 'border-white/20' : 'border-white/20'
            }`}
          >
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

              {/* Boutons ajoutés dans le menu mobile */}
              <div className="flex flex-col space-y-3 pt-4">
                <Button variant="outline" className="bg-primary text-white rounded-full py-3"
                >
                  <a 
                    href="https://wa.me/22890554121"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rejoignez-nous
                  </a>
                  
                </Button>
                <Button
                  variant="outline"
                  className="border-primary text-primary rounded-full py-3"
                  onClick={() => (window.location.href = '/admin/login')}
                >
                  Espace Parent
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;