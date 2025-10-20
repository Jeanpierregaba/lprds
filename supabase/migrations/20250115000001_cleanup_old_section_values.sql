-- Migration pour nettoyer les anciennes valeurs de section dans la table children
-- et s'assurer que toutes les données utilisent les nouvelles valeurs d'enum child_section_new

-- D'abord, vérifier s'il y a des valeurs invalides dans la colonne section
-- et les corriger si nécessaire

-- Mettre à jour les anciennes valeurs vers les nouvelles (au cas où il y en aurait)
UPDATE public.children 
SET section = 'creche_etoile' 
WHERE section = 'creche';

UPDATE public.children 
SET section = 'maternelle_PS1' 
WHERE section = 'maternelle_etoile';

UPDATE public.children 
SET section = 'maternelle_PS2' 
WHERE section = 'maternelle_soleil';

-- Corriger la casse de Maternelle_MS vers maternelle_MS
UPDATE public.children 
SET section = 'maternelle_MS' 
WHERE section = 'Maternelle_MS';

-- S'assurer que toutes les valeurs de section sont valides
-- Si une valeur n'est pas dans l'enum, la mettre à 'garderie' par défaut
UPDATE public.children 
SET section = 'garderie' 
WHERE section NOT IN (
    'creche_etoile', 
    'creche_nuage', 
    'creche_soleil', 
    'garderie', 
    'maternelle_PS1', 
    'maternelle_PS2', 
    'maternelle_MS',
    'maternelle_GS'
);

-- Faire la même chose pour la table groups
UPDATE public.groups 
SET section = 'creche_etoile' 
WHERE section = 'creche';

UPDATE public.groups 
SET section = 'maternelle_PS1' 
WHERE section = 'maternelle_etoile';

UPDATE public.groups 
SET section = 'maternelle_PS2' 
WHERE section = 'maternelle_soleil';

-- Corriger la casse de Maternelle_MS vers maternelle_MS
UPDATE public.groups 
SET section = 'maternelle_MS' 
WHERE section = 'Maternelle_MS';

UPDATE public.groups 
SET section = 'garderie' 
WHERE section NOT IN (
    'creche_etoile', 
    'creche_nuage', 
    'creche_soleil', 
    'garderie', 
    'maternelle_PS1', 
    'maternelle_PS2', 
    'maternelle_MS',
    'maternelle_GS'
);

-- Ajouter une contrainte pour s'assurer que seules les valeurs valides sont acceptées
-- (cette contrainte existe déjà via l'enum, mais on peut ajouter un check explicite)
ALTER TABLE public.children 
ADD CONSTRAINT check_valid_section 
CHECK (section IN (
    'creche_etoile', 
    'creche_nuage', 
    'creche_soleil', 
    'garderie', 
    'maternelle_PS1', 
    'maternelle_PS2', 
    'maternelle_MS',
    'maternelle_GS'
));

ALTER TABLE public.groups 
ADD CONSTRAINT check_valid_group_section 
CHECK (section IN (
    'creche_etoile', 
    'creche_nuage', 
    'creche_soleil', 
    'garderie', 
    'maternelle_PS1', 
    'maternelle_PS2', 
    'maternelle_MS',
    'maternelle_GS'
));
