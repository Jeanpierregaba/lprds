import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Heart, Sun, Twitter, Linkedin} from 'lucide-react';
import logo from '@/assets/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTiktok } from '@fortawesome/free-brands-svg-icons'
import { faFacebook } from '@fortawesome/free-brands-svg-icons'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faLinkedin } from '@fortawesome/free-brands-svg-icons'


const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main footer content */}
      <div className="section-padding border-b border-primary-foreground/10">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Logo & Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <a href="/">
                <div>
                  <img src={logo} alt="Logo" className="w-[200px] inline" />
                  
                </div>
                </a>

              </div>
              <p className="text-primary-foreground/80 leading-relaxed mb-6 max-w-md">
                Depuis 2022, nous accompagnons les enfants de 3 mois à 8 ans dans leur épanouissement quotidien. 
                Un environnement sécurisé, bienveillant et stimulant pour grandir en toute sérénité.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/p/Les-Petits-Rayons-de-Soleil-61559745601729/" className="w-10 h-10 bg-primary-foreground/10 hover:bg-secondary rounded-full flex items-center justify-center transition-colors duration-300">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
                <a href="https://www.instagram.com/lespetitsrayonsdesoleil_?igsh=Y2Y5NGZlaDVjZjF6" className="w-10 h-10 bg-primary-foreground/10 hover:bg-secondary rounded-full flex items-center justify-center transition-colors duration-300">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="https://www.linkedin.com/company/lespetitsrayonsdesoleil/" className="w-10 h-10 bg-primary-foreground/10 hover:bg-secondary rounded-full flex items-center justify-center transition-colors duration-300">
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
                <a href="https://www.tiktok.com/@lespetitsrayonsdesoleil?_r=1&_t=ZM-91KJBfZgTVM" className="w-10 h-10 bg-primary-foreground/10 hover:bg-secondary rounded-full flex items-center justify-center transition-colors duration-300">
                  <FontAwesomeIcon icon={faTiktok} />
                </a>

              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-fredoka text-lg mb-6">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div className="text-primary-foreground/80">
                    <div>Quatrième von à droite dans la rue en face du commissariat du 3eme district, Djidjolé, Lomé-TOGO</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                  <a href="tel:+22898602920" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                    +228 98 60 29 20
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                  <a href="mailto:contact@petitsrayons.fr" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                    contact@lespetitsrayonsdesoleil.fr
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="font-fredoka text-lg mb-6">Horaires</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-secondary flex-shrink-0" />
                  <div className="text-primary-foreground/80">
                    <div className="font-medium">Lundi - Vendredi</div>
                    <div className="text-sm">7h - 19h</div>
                    <div className="font-medium">Espace de jeux :</div>
                    <div className="text-sm">Samedi : 11h - 19h</div>
                    <div className="text-sm">Dimanche : 14h - 19h</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
                  <div className="text-sm font-medium text-secondary mb-1">Urgence</div>
                  <div className="text-sm text-primary-foreground/80">
                    +228 98 60 29 20
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="section-padding py-6">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-primary-foreground/60 text-sm">
              © 2025 Les Petits Rayons de Soleil. Tous droits réservés.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/mentions-legales.pdf" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-secondary transition-colors">
                Mentions légales
              </a>
              <a href="/politique-de-confidentialite.pdf" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-secondary transition-colors">
                Politique de confidentialité
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;