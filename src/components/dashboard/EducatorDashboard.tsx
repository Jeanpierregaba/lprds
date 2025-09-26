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
  Activity,
  MapPin,
  BookOpen,
  Utensils
} from 'lucide-react';

// Données fictives pour la démonstration
const myGroupChildren = [
  {
    id: 1,
    firstName: 'Emma',
    lastName: 'M.',
    age: '2 ans',
    photo: null,
    isPresent: true,
    arrivalTime: '08:30',
    expectedDeparture: '16:30',
    mood: 'content',
    allergies: ['Arachides'],
    medicationDue: null,
    napTaken: false,
    mealEaten: 'partial'
  },
  {
    id: 2,
    firstName: 'Lucas',
    lastName: 'D.',
    age: '3 ans',
    photo: null,
    isPresent: true,
    arrivalTime: '09:00',
    expectedDeparture: '17:00',
    mood: 'joyeux',
    allergies: [],
    medicationDue: null,
    napTaken: true,
    mealEaten: 'full'
  },
  {
    id: 3,
    firstName: 'Léa',
    lastName: 'Mo.',
    age: '18 mois',
    photo: null,
    isPresent: false,
    arrivalTime: null,
    expectedDeparture: null,
    mood: null,
    allergies: ['Lactose'],
    medicationDue: null,
    napTaken: null,
    mealEaten: null
  },
  {
    id: 4,
    firstName: 'Tom',
    lastName: 'L.',
    age: '2.5 ans',
    photo: null,
    isPresent: true,
    arrivalTime: '08:45',
    expectedDeparture: '16:00',
    mood: 'fatigué',
    allergies: [],
    medicationDue: '14:30 - Doliprane',
    napTaken: false,
    mealEaten: 'refused'
  }
];

const pendingMessages = [
  {
    id: 1,
    from: 'Mme Martin (Emma)',
    time: '08:20',
    subject: 'Retard ce matin',
    preview: 'Emma arrivera vers 09h00 à cause d\'un RDV médical...',
    urgent: false,
    childName: 'Emma'
  },
  {
    id: 2,
    from: 'M. Dubois (Lucas)',
    time: '13:45',
    subject: 'Question alimentation',
    preview: 'Pouvez-vous me dire ce que Lucas a mangé ce midi...',
    urgent: false,
    childName: 'Lucas'
  }
];

const todayActivities = [
  {
    id: 1,
    time: '09:30',
    title: 'Éveil Musical',
    description: 'Découverte des instruments',
    location: 'Salle d\'activité',
    children: ['Emma', 'Lucas', 'Tom']
  },
  {
    id: 2,
    time: '10:30',
    title: 'Peinture Libre',
    description: 'Expression créative',
    location: 'Atelier arts',
    children: ['Emma', 'Lucas']
  },
  {
    id: 3,
    time: '14:30',
    title: 'Lecture de Contes',
    description: 'Histoire de la petite souris',
    location: 'Coin lecture',
    children: ['Tom']
  },
  {
    id: 4,
    time: '15:30',
    title: 'Jeu Libre',
    description: 'Activités autonomes',
    location: 'Salle de jeu',
    children: ['Emma', 'Lucas', 'Tom']
  }
];

export const EducatorDashboard = () => {
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

  const getMealIcon = (status: string | null) => {
    switch (status) {
      case 'full': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'refused': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const presentChildren = myGroupChildren.filter(child => child.isPresent);
  const totalChildren = myGroupChildren.length;
  const medicationsToGive = myGroupChildren.filter(child => child.medicationDue);

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espace Éducateur</h1>
          <p className="text-muted-foreground">{currentDate} - Section Petits</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm">
            Sophie Moreau - Éducatrice
          </Badge>
        </div>
      </div>

      {/* Alertes médicaments */}
      {medicationsToGive.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Médicaments à Administrer ({medicationsToGive.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {medicationsToGive.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium">{child.firstName} {child.lastName}</span>
                    <p className="text-sm text-muted-foreground">{child.medicationDue}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Confirmer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistiques du groupe */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              de mon groupe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Parents</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pendingMessages.length}
            </div>
            <p className="text-xs text-muted-foreground">
              en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activités Prévues</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {todayActivities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siestes Prises</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {presentChildren.filter(child => child.napTaken).length}
            </div>
            <p className="text-xs text-muted-foreground">
              enfants endormis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des enfants du groupe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Mon Groupe - Suivi de la Journée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myGroupChildren.map((child) => (
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
                          <span>Arrivé à {child.arrivalTime}</span>
                          <span>•</span>
                          <span>Départ prévu: {child.expectedDeparture}</span>
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
                
                <div className="flex items-center gap-4">
                  {/* Humeur */}
                  {child.isPresent && child.mood && (
                    <div className="text-center">
                      <div className="text-2xl mb-1">{getMoodIcon(child.mood)}</div>
                      <div className={`text-xs ${getMoodColor(child.mood)}`}>
                        {child.mood}
                      </div>
                    </div>
                  )}

                  {/* Repas */}
                  {child.isPresent && (
                    <div className="text-center">
                      {getMealIcon(child.mealEaten)}
                      <div className="text-xs mt-1">Repas</div>
                    </div>
                  )}

                  {/* Sieste */}
                  {child.isPresent && (
                    <div className="text-center">
                      {child.napTaken ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                      <div className="text-xs mt-1">Sieste</div>
                    </div>
                  )}

                  {/* Allergies */}
                  {child.allergies.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {child.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
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
        {/* Messages des parents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages des Parents
            </CardTitle>
            <CardDescription>Communications en attente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMessages.map((message) => (
                <div key={message.id} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.from}</span>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                        <Badge variant="outline" className="text-xs">{message.childName}</Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                      <p className="text-sm text-muted-foreground">{message.preview}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Répondre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Planning des activités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning des Activités
            </CardTitle>
            <CardDescription>Programme de la journée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="text-center min-w-[60px]">
                    <div className="font-medium text-sm">{activity.time}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {activity.children.map((child, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {child}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};