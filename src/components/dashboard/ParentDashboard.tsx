import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Baby, 
  Clock, 
  MessageSquare, 
  Calendar,
  Camera,
  Heart,
  AlertCircle,
  CheckCircle,
  Users,
  Activity
} from 'lucide-react';

// Données fictives pour la démonstration
const myChildren = [
  {
    id: 1,
    firstName: 'Emma',
    lastName: 'Martin',
    age: '2 ans',
    photo: null,
    isPresent: true,
    arrivalTime: '08:30',
    departureTime: '16:30',
    mood: 'content',
    lastActivity: 'Peinture avec les doigts',
    allergies: ['Arachides']
  },
  {
    id: 2,
    firstName: 'Lucas',
    lastName: 'Dubois',
    age: '3 ans',
    photo: null,
    isPresent: true,
    arrivalTime: '09:00',
    departureTime: '17:00',
    mood: 'joyeux',
    lastActivity: 'Jeu de construction',
    allergies: []
  },
  {
    id: 3,
    firstName: 'Léa',
    lastName: 'Moreau',
    age: '18 mois',
    photo: null,
    isPresent: false,
    arrivalTime: null,
    departureTime: null,
    mood: null,
    lastActivity: null,
    allergies: ['Lactose']
  }
];

const todayMessages = [
  {
    id: 1,
    from: 'Mme Sophie (Éducatrice)',
    time: '14:30',
    subject: 'Activité peinture',
    preview: 'Emma a adoré l\'activité peinture cet après-midi...',
    isRead: false,
    urgent: false
  },
  {
    id: 2,
    from: 'Direction',
    time: '10:15',
    subject: 'Information importante',
    preview: 'Réunion parents-éducateurs prévue le...',
    isRead: true,
    urgent: true
  }
];

const weekSchedule = [
  { day: 'Lun', date: '24', children: ['Emma', 'Lucas'] },
  { day: 'Mar', date: '25', children: ['Emma', 'Lucas', 'Léa'] },
  { day: 'Mer', date: '26', children: ['Emma', 'Lucas'] },
  { day: 'Jeu', date: '27', children: ['Emma', 'Léa'] },
  { day: 'Ven', date: '28', children: ['Lucas'] }
];

const recentPhotos = [
  { id: 1, activity: 'Activité peinture', date: 'Aujourd\'hui 14:30', children: ['Emma'] },
  { id: 2, activity: 'Jeu libre', date: 'Aujourd\'hui 10:15', children: ['Lucas'] },
  { id: 3, activity: 'Sieste', date: 'Hier 14:00', children: ['Léa'] }
];

export const ParentDashboard = () => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'joyeux': return '😊';
      case 'content': return '😌';
      case 'fatigué': return '😴';
      case 'grognon': return '😤';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string | null) => {
    switch (mood) {
      case 'joyeux': return 'text-green-600';
      case 'content': return 'text-blue-600';
      case 'fatigué': return 'text-purple-600';
      case 'grognon': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const presentChildren = myChildren.filter(child => child.isPresent);
  const totalChildren = myChildren.length;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espace Parents</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Famille Martin-Dubois
          </Badge>
        </div>
      </div>

      {/* Résumé du jour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enfants Présents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {presentChildren.length}/{totalChildren}
            </div>
            <p className="text-xs text-muted-foreground">
              {presentChildren.length > 0 ? 'À la crèche' : 'Aucun enfant présent'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Non Lus</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayMessages.filter(m => !m.isRead).length}
            </div>
            <p className="text-xs text-muted-foreground">
              nouveaux messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Partagées</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {recentPhotos.length}
            </div>
            <p className="text-xs text-muted-foreground">
              nouvelles aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mes enfants - Résumé journalier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Mes Enfants - Résumé du Jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myChildren.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={child.photo || undefined} />
                    <AvatarFallback>
                      {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{child.firstName} {child.lastName}</h3>
                      <Badge variant="outline" className="text-xs">{child.age}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {child.isPresent ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Présent</span>
                          <span>•</span>
                          <Clock className="h-4 w-4" />
                          <span>{child.arrivalTime} - {child.departureTime}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span>Absent aujourd'hui</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  {child.isPresent && child.mood && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodIcon(child.mood)}</span>
                      <span className={`text-sm ${getMoodColor(child.mood)}`}>
                        {child.mood.charAt(0).toUpperCase() + child.mood.slice(1)}
                      </span>
                    </div>
                  )}
                  {child.lastActivity && (
                    <p className="text-xs text-muted-foreground">
                      Dernière activité: {child.lastActivity}
                    </p>
                  )}
                  {child.allergies.length > 0 && (
                    <div className="flex gap-1">
                      {child.allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages de l'Équipe
            </CardTitle>
            <CardDescription>Communications récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayMessages.map((message) => (
                <div key={message.id} className={`p-3 border rounded-lg ${!message.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.from}</span>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                        {message.urgent && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {!message.isRead && (
                          <Badge variant="default" className="text-xs">Non lu</Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                      <p className="text-sm text-muted-foreground">{message.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dernières photos partagées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Dernières Photos
            </CardTitle>
            <CardDescription>Moments partagés par l'équipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{photo.activity}</h4>
                      <p className="text-xs text-muted-foreground">{photo.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {photo.children.map((child, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {child}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning de présence à venir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning de Présence - Cette Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {weekSchedule.map((day, index) => (
              <div key={index} className="text-center p-3 border rounded-lg">
                <div className="font-medium text-sm mb-2">{day.day}</div>
                <div className="text-lg font-bold text-primary mb-2">{day.date}</div>
                <div className="space-y-1">
                  {day.children.map((child, childIndex) => (
                    <Badge key={childIndex} variant="secondary" className="text-xs block">
                      {child}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};