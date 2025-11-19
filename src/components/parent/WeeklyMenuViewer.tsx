import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Coffee, UtensilsCrossed, IceCream, Cookie } from 'lucide-react';

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
              <CardTitle className="text-primary text-xl">
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
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left font-semibold">
                    Repas
                  </th>
                  {DAYS_OF_WEEK.map((dayName, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isToday = isSameDay(date, new Date());

                    return (
                      <th
                        key={dateStr}
                        className={`min-w-[120px] border border-border px-3 py-2 text-center align-middle ${
                          isToday ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/60'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{dayName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(date, 'd MMMM', { locale: fr })}
                          </span>
                          {isToday && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Aujourd'hui
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left align-top font-medium">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      <span>Collation</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map((_, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const mealPlan = mealPlans[dateStr];

                    return (
                      <td key={`${dateStr}-snack-morning`} className="border border-border px-3 py-3 align-top">
                        {mealPlan?.snack_morning ? (
                          <span className="text-xs sm:text-sm">{mealPlan.snack_morning}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Non prévu</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left align-top font-medium">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      <span>Déjeuner</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map((_, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const mealPlan = mealPlans[dateStr];

                    return (
                      <td key={`${dateStr}-lunch`} className="border border-border px-3 py-3 align-top">
                        {mealPlan?.lunch ? (
                          <span className="text-xs sm:text-sm font-medium">{mealPlan.lunch}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Menu non encore planifié</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left align-top font-medium">
                    <div className="flex items-center gap-2">
                      <IceCream className="h-4 w-4" />
                      <span>Dessert</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map((_, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const mealPlan = mealPlans[dateStr];

                    return (
                      <td key={`${dateStr}-dessert`} className="border border-border px-3 py-3 align-top">
                        {mealPlan?.dessert ? (
                          <span className="text-xs sm:text-sm">{mealPlan.dessert}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Non prévu</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left align-top font-medium">
                    <div className="flex items-center gap-2">
                      <Cookie className="h-4 w-4" />
                      <span>Goûter</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map((_, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const mealPlan = mealPlans[dateStr];

                    return (
                      <td key={`${dateStr}-snack-afternoon`} className="border border-border px-3 py-3 align-top">
                        {mealPlan?.snack_afternoon ? (
                          <span className="text-xs sm:text-sm">{mealPlan.snack_afternoon}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Non prévu</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th className="sticky left-0 z-10 bg-background border border-r border-border px-3 py-3 text-left align-top font-medium">
                    <span>Notes</span>
                  </th>
                  {DAYS_OF_WEEK.map((_, index) => {
                    const date = addDays(currentWeekStart, index);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const mealPlan = mealPlans[dateStr];

                    return (
                      <td key={`${dateStr}-notes`} className="border border-border px-3 py-3 align-top">
                        {mealPlan?.notes ? (
                          <span className="text-xs sm:text-sm break-words">{mealPlan.notes}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Aucune note</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground text-center">
            Tous nos repas sont faits maison avec beaucoup d'amour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
