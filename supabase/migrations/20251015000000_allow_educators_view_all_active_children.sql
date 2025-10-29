-- Migration pour permettre aux éducateurs de voir tous les enfants actifs
-- Cela leur permet de créer des rapports quotidiens pour tous les enfants inscrits

-- Supprimer l'ancienne politique restrictive pour les éducateurs sur la table children
DROP POLICY IF EXISTS "Educators can view their assigned children" ON public.children;

-- Créer une nouvelle politique qui permet aux éducateurs de voir tous les enfants actifs
CREATE POLICY "Educators can view all active children"
ON public.children FOR SELECT
USING (
  public.is_educator(auth.uid()) 
  AND status = 'active'
);

-- Supprimer l'ancienne politique restrictive pour les éducateurs sur daily_reports
DROP POLICY IF EXISTS "Educators can manage reports for their children" ON public.daily_reports;

-- Créer une politique pour SELECT/UPDATE/DELETE permettant aux éducateurs de gérer les rapports pour tous les enfants actifs
CREATE POLICY "Educators can manage reports for all active children"
ON public.daily_reports
FOR ALL
TO authenticated
USING (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_reports.child_id 
    AND c.status = 'active'
  )
);

-- Créer une politique pour INSERT permettant aux éducateurs de créer des rapports pour tous les enfants actifs
CREATE POLICY "Educators can insert reports for all active children"
ON public.daily_reports
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_reports.child_id 
    AND c.status = 'active'
  )
);

