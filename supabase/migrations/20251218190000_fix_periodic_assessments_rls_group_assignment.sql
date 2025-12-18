-- Fix RLS for periodic_assessments when children are assigned via groups (group_id)
-- so educators can see/create/update/delete their assessments for children in their group,
-- not only children with children.assigned_educator_id set.

-- Drop old educator policies (they only handle children.assigned_educator_id)
DROP POLICY IF EXISTS "Educators can manage assessments for their assigned children" ON public.periodic_assessments;
DROP POLICY IF EXISTS "Educators can insert assessments for their assigned children" ON public.periodic_assessments;

-- Educators can SELECT their own periodic assessments for children either directly assigned
-- OR assigned via a group attached to the educator.
CREATE POLICY "Educators can select periodic assessments for their assigned children or group"
ON public.periodic_assessments
FOR SELECT
USING (
  is_educator(auth.uid())
  AND educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.children c
    LEFT JOIN public.groups g ON g.id = c.group_id
    WHERE c.id = periodic_assessments.child_id
      AND (
        c.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR g.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
);

-- Educators can INSERT periodic assessments for children either directly assigned
-- OR assigned via a group attached to the educator.
-- Also enforce educator_id must match the current educator profile.
CREATE POLICY "Educators can insert periodic assessments for their assigned children or group"
ON public.periodic_assessments
FOR INSERT
WITH CHECK (
  is_educator(auth.uid())
  AND educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.children c
    LEFT JOIN public.groups g ON g.id = c.group_id
    WHERE c.id = periodic_assessments.child_id
      AND (
        c.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR g.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
);

-- Educators can UPDATE their own periodic assessments for children either directly assigned
-- OR assigned via a group attached to the educator.
-- Also enforce educator_id must remain the current educator profile.
CREATE POLICY "Educators can update periodic assessments for their assigned children or group"
ON public.periodic_assessments
FOR UPDATE
USING (
  is_educator(auth.uid())
  AND educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.children c
    LEFT JOIN public.groups g ON g.id = c.group_id
    WHERE c.id = periodic_assessments.child_id
      AND (
        c.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR g.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
)
WITH CHECK (
  is_educator(auth.uid())
  AND educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.children c
    LEFT JOIN public.groups g ON g.id = c.group_id
    WHERE c.id = periodic_assessments.child_id
      AND (
        c.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR g.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
);

-- Educators can DELETE their own periodic assessments for children either directly assigned
-- OR assigned via a group attached to the educator.
CREATE POLICY "Educators can delete periodic assessments for their assigned children or group"
ON public.periodic_assessments
FOR DELETE
USING (
  is_educator(auth.uid())
  AND educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.children c
    LEFT JOIN public.groups g ON g.id = c.group_id
    WHERE c.id = periodic_assessments.child_id
      AND (
        c.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR g.assigned_educator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
);


