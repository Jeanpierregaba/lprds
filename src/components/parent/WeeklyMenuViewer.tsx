import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Coffee, UtensilsCrossed, IceCream, Cookie, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MealPlan {
  id: string;
  plan_date: string;
  snack_morning?: string;
  lunch: string;
  dessert?: string;
  snack_afternoon?: string;
  notes?: string;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export default function WeeklyMenuViewer() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [loading, setLoading] = useState(true);

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
      .in('plan_date', weekDates)
      .order('plan_date');

    if (!error && data) {
      const plansMap: Record<string, MealPlan> = {};
      data.forEach(plan => {
        plansMap[plan.plan_date] = plan;
      });
      setMealPlans(plansMap);
    }
    setLoading(false);
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl">
                Menus de la semaine
              </CardTitle>
              <CardDescription>
                {format(currentWeekStart, 'd MMMM', { locale: fr })} - {format(addDays(currentWeekStart, 4), 'd MMMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map((dayName, index) => {
            const date = addDays(currentWeekStart, index);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isToday = isSameDay(date, new Date());
            const mealPlan = mealPlans[dateStr];

            return (
              <Card key={dateStr} className={isToday ? 'border-primary shadow-sm' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
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
                <CardContent>
                  {mealPlan ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {mealPlan.snack_morning && (
                          <div className="flex items-start gap-2">
                            <Coffee className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Collation matin</p>
                              <p className="text-sm">{mealPlan.snack_morning}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <UtensilsCrossed className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Déjeuner</p>
                            <p className="text-sm font-medium">{mealPlan.lunch}</p>
                          </div>
                        </div>

                        {mealPlan.dessert && (
                          <div className="flex items-start gap-2">
                            <IceCream className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Dessert</p>
                              <p className="text-sm">{mealPlan.dessert}</p>
                            </div>
                          </div>
                        )}

                        {mealPlan.snack_afternoon && (
                          <div className="flex items-start gap-2">
                            <Cookie className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Goûter</p>
                              <p className="text-sm">{mealPlan.snack_afternoon}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {mealPlan.notes && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {mealPlan.notes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Menu non encore planifié
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
