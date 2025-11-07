import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import contact from '@/assets/contactPic.jpg';
import MapEmbed from '@/components/mapEmbed';
import { PageHero } from '@/components/common/PageHero';


const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    childAge: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openingHours = [
    { day: 'Lundi', hours: '7h30 - 18h30', isOpen: true },
    { day: 'Mardi', hours: '7h30 - 18h30', isOpen: true },
    { day: 'Mercredi', hours: '7h30 - 18h30', isOpen: true },
    { day: 'Jeudi', hours: '7h30 - 18h30', isOpen: true },
    { day: 'Vendredi', hours: '7h30 - 18h30', isOpen: true },
    { day: 'Samedi (Espace de jeu en plein air)', hours: '12h30 - 17h30', isOpen: true },
    { day: 'Dimanche', hours: 'Fermé', isOpen: false },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero section */}
        <PageHero
          title="Contactez-nous"
          subtitle="Une question ? Un projet d'inscription ? Notre équipe est là pour vous accompagner et vous renseigner."
          badgeText="Contact"
          badgeIcon={MessageCircle}
          backgroundImage={contact}
          gradientOverlay="bg-secondary/90 bg-gradient-to-b from-black/40 via-black/50 to-black/50"
        />

        {/* Contact form and info */}
        <section className="section-padding py-12 sm:py-16 lg:py-20">
          <div className="container-custom px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Contact form */}
              <div className="card-soft">
                <h2 className="text-2xl font-fredoka text-foreground mb-6">
                  Envoyez-nous un message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="+228 00 00 00 00"
                      />
                    </div>
                    <div>
                      <label htmlFor="childAge" className="block text-sm font-medium text-foreground mb-2">
                        Âge de l'enfant
                      </label>
                      <select
                        id="childAge"
                        name="childAge"
                        value={formData.childAge}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Sélectionner</option>
                        <option value="3-18mois">3 - 18 mois</option>
                        <option value="12-24mois">18 - 24 mois</option>
                        <option value="24-36mois">24 - 36 mois</option>
                        <option value="3-8ans">3 - 8 ans</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Parlez-nous de votre projet, vos questions..."
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-primary w-full hover:bg-accent">
                    Envoyer le message
                  </button>

                  <p className="text-xs text-muted-foreground">
                    * Champs obligatoires. Nous vous répondrons dans les 24h.
                  </p>
                </form>
              </div>

              {/* Contact info */}
              <div className="space-y-8">
                {/* Main contact */}
                <div className="card-soft">
                  <h3 className="text-xl font-fredoka text-foreground mb-6">
                    Informations de contact
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-medium text-foreground">Adresse</div>
                        <div className="text-muted-foreground">
                          <br />
                          Quatrième von à droite dans la rue en face du commissariat du 3eme district, Djidjolé, Lomé-TOGO
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Phone className="w-6 h-6 text-secondary flex-shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">Téléphone</div>
                        <a href="tel:0478123456" className="text-muted-foreground hover:text-primary">
                        +228 98 60 29 20
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Mail className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">Email</div>
                        <a href="mailto:contact@petitsrayons.fr" className="text-muted-foreground hover:text-primary">
                          contact@lespetitsrayonsdesoleil.fr
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opening hours */}
                <div className="card-soft">
                  <h3 className="text-xl font-fredoka text-foreground mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Horaires d'ouverture
                  </h3>
                  <div className="space-y-3">
                    {openingHours.map((schedule) => (
                      <div key={schedule.day} className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{schedule.day}</span>
                        <span className={`text-sm ${schedule.isOpen ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-2 text-secondary text-sm">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Urgence: +228 98 60 29 20</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="card-soft bg-gradient-to-br from-accent/10 to-primary/5">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-fredoka text-lg text-foreground mb-2">
                      Contact rapide
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Pour une réponse immédiate, contactez-nous via WhatsApp
                    </p>
                    <a 
                    href="https://wa.me/22890554121"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className="btn-accent w-full hover:bg-primary">
                      WhatsApp
                    </button>
                  </a>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map section */}
        <section className="section-padding py-12 sm:py-16 lg:py-20 bg-muted/30">
          <div className="container-custom px-4">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-fredoka text-foreground mb-3 sm:mb-4">
                Nous trouver
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                La crèche est facilement accessible en transports en commun et dispose d'un parking.
              </p>
            </div>

            {/* Map placeholder */}
            <div className="card-soft overflow-hidden">
              <MapEmbed />
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;