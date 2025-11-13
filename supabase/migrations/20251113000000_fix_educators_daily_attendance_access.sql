-- Migration pour permettre aux éducateurs d'accéder aux données d'attendance de tous les enfants actifs
-- Cela corrige le bug où les éducateurs ne peuvent pas charger les heures et températures
-- depuis le pointage QR lors du remplissage du formulaire de suivi quotidien

-- Supprimer l'ancienne politique restrictive pour les éducateurs sur daily_attendance
DROP POLICY IF EXISTS "Educators can manage attendance for their children" ON public.daily_attendance;

-- Créer une nouvelle politique pour SELECT/UPDATE/DELETE permettant aux éducateurs 
-- d'accéder aux données d'attendance de tous les enfants actifs
CREATE POLICY "Educators can manage attendance for all active children"
ON public.daily_attendance
FOR ALL
TO authenticated
USING (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_attendance.child_id 
    AND c.status = 'active'
  )
);

-- Créer une politique pour INSERT permettant aux éducateurs 
-- de créer des enregistrements d'attendance pour tous les enfants actifs
CREATE POLICY "Educators can insert attendance for all active children"
ON public.daily_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_attendance.child_id 
    AND c.status = 'active'
  )
);
