import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save, Coffee, UtensilsCrossed, IceCream, Cookie } from 'lucide-react';

interface MealPlan {
  id?: string;
  plan_date: string;
  snack_morning?: string;
  lunch: string;
  dessert?: string;
  snack_afternoon?: string;
  notes?: string;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export default function MenuPlanningPage() {
  const { profile } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWeekMeals();
  }, [currentWeekStart]);

  const loadWeekMeals = async () => {
    setLoading(true);
    const weekDates = Array.from({ length: 5 }, (_, i) => 
      format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
    );

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .in('plan_date', weekDates);

    if (error) {
      toast.error('Erreur lors du chargement des menus');
      console.error(error);
    } else {
      const plansMap: Record<string, MealPlan> = {};
      data?.forEach(plan => {
        plansMap[plan.plan_date] = plan;
      });
      setMealPlans(plansMap);
    }
    setLoading(false);
  };

  const handleSaveMeal = async (dateStr: string) => {
    if (!profile?.id) return;
    
    const mealPlan = mealPlans[dateStr];
    if (!mealPlan?.lunch?.trim()) {
      toast.error('Le déjeuner est obligatoire');
      return;
    }

    setSaving(true);

    const payload = {
      plan_date: dateStr,
      snack_morning: mealPlan.snack_morning || null,
      lunch: mealPlan.lunch,
      dessert: mealPlan.dessert || null,
      snack_afternoon: mealPlan.snack_afternoon || null,
      notes: mealPlan.notes || null,
      created_by: profile.id,
    };

    const { error } = await supabase
      .from('meal_plans')
      .upsert(payload, { onConflict: 'plan_date' });

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } else {
      toast.success('Menu sauvegardé avec succès');
      loadWeekMeals();
    }
    setSaving(false);
  };

  const updateMealField = (dateStr: string, field: keyof MealPlan, value: string) => {
    setMealPlans(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        plan_date: dateStr,
        lunch: prev[dateStr]?.lunch || '',
        [field]: value,
      }
    }));
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Planning des Menus</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les menus de la semaine pour tous les enfants
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>
                Semaine du {format(currentWeekStart, 'd MMMM yyyy', { locale: fr })}
              </CardTitle>
              <CardDescription>
                au {format(addDays(currentWeekStart, 4), 'd MMMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToCurrentWeek}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_OF_WEEK.map((dayName, index) => {
            const date = addDays(currentWeekStart, index);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isToday = isSameDay(date, new Date());
            const mealPlan = mealPlans[dateStr] || { plan_date: dateStr, lunch: '' };

            return (
              <Card key={dateStr} className={isToday ? 'border-primary' : ''}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {dayName}
                    <span className="text-sm font-normal text-muted-foreground">
                      {format(date, 'd MMMM', { locale: fr })}
                    </span>
                    {isToday && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        Aujourd'hui
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Collation du matin
                      </Label>
                      <Input
                        placeholder="Ex: Fruits frais, yaourt"
                        value={mealPlan.snack_morning || ''}
                        onChange={(e) => updateMealField(dateStr, 'snack_morning', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Déjeuner <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Ex: Poulet, riz, légumes"
                        value={mealPlan.lunch || ''}
                        onChange={(e) => updateMealField(dateStr, 'lunch', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <IceCream className="h-4 w-4" />
                        Dessert
                      </Label>
                      <Input
                        placeholder="Ex: Compote, fruit"
                        value={mealPlan.dessert || ''}
                        onChange={(e) => updateMealField(dateStr, 'dessert', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Cookie className="h-4 w-4" />
                        Goûter
                      </Label>
                      <Input
                        placeholder="Ex: Pain, chocolat, lait"
                        value={mealPlan.snack_afternoon || ''}
                        onChange={(e) => updateMealField(dateStr, 'snack_afternoon', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes supplémentaires</Label>
                    <Textarea
                      placeholder="Remarques, allergènes, etc."
                      value={mealPlan.notes || ''}
                      onChange={(e) => updateMealField(dateStr, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={() => handleSaveMeal(dateStr)}
                    disabled={saving || !mealPlan.lunch?.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
