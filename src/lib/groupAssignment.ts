import { supabase } from '@/integrations/supabase/client';

/**
 * Trouve et assigne automatiquement un enfant à un groupe approprié selon sa section
 * @param childId - ID de l'enfant
 * @param section - Section de l'enfant
 * @param birthDate - Date de naissance de l'enfant (pour vérifier la compatibilité d'âge)
 * @returns L'ID du groupe assigné ou null
 */
export async function autoAssignChildToGroup(
  childId: string,
  section: 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | null,
  birthDate: string
): Promise<string | null> {
  if (!section) return null;

  try {
    // Calculer l'âge en mois
    const ageInMonths = calculateAgeInMonths(birthDate);

    // Récupérer tous les groupes de cette section avec le nombre d'enfants actuels
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, capacity, age_min_months, age_max_months')
      .eq('section', section)
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('Erreur lors de la récupération des groupes:', groupsError);
      return null;
    }

    if (!groups || groups.length === 0) {
      console.warn(`Aucun groupe trouvé pour la section ${section}`);
      return null;
    }

    // Pour chaque groupe, compter le nombre d'enfants
    const groupsWithCount = await Promise.all(
      groups.map(async (group) => {
        const { count, error: countError } = await supabase
          .from('children')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (countError) {
          console.error('Erreur lors du comptage des enfants:', countError);
          return { ...group, currentCount: 0 };
        }

        return { ...group, currentCount: count || 0 };
      })
    );

    // Filtrer les groupes compatibles (âge et capacité disponible)
    const eligibleGroups = groupsWithCount.filter((group) => {
      const hasCapacity = group.currentCount < (group.capacity || 15);
      const isAgeCompatible =
        (!group.age_min_months || ageInMonths >= group.age_min_months) &&
        (!group.age_max_months || ageInMonths <= group.age_max_months);
      
      return hasCapacity && isAgeCompatible;
    });

    if (eligibleGroups.length === 0) {
      console.warn(`Aucun groupe disponible avec capacité suffisante pour la section ${section}`);
      return null;
    }

    // Sélectionner le groupe avec le plus de places disponibles
    const selectedGroup = eligibleGroups.reduce((best, current) => {
      const bestAvailable = (best.capacity || 15) - best.currentCount;
      const currentAvailable = (current.capacity || 15) - current.currentCount;
      return currentAvailable > bestAvailable ? current : best;
    });

    // Assigner l'enfant au groupe
    const { error: updateError } = await supabase
      .from('children')
      .update({ group_id: selectedGroup.id })
      .eq('id', childId);

    if (updateError) {
      console.error('Erreur lors de l\'assignation au groupe:', updateError);
      return null;
    }

    console.log(`Enfant ${childId} assigné automatiquement au groupe ${selectedGroup.name}`);
    return selectedGroup.id;
  } catch (error) {
    console.error('Erreur dans autoAssignChildToGroup:', error);
    return null;
  }
}

/**
 * Calcule l'âge en mois à partir de la date de naissance
 */
function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  
  return months;
}

/**
 * Réassigne automatiquement un enfant si sa section change
 */
export async function reassignChildOnSectionChange(
  childId: string,
  newSection: 'creche' | 'garderie' | 'maternelle_etoile' | 'maternelle_soleil' | null,
  birthDate: string
): Promise<string | null> {
  // Retirer l'enfant de son groupe actuel
  const { error: removeError } = await supabase
    .from('children')
    .update({ group_id: null })
    .eq('id', childId);

  if (removeError) {
    console.error('Erreur lors du retrait du groupe actuel:', removeError);
    return null;
  }

  // Assigner au nouveau groupe
  return autoAssignChildToGroup(childId, newSection, birthDate);
}
