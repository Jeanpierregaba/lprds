-- Migration pour corriger la casse de Maternelle_MS vers maternelle_MS dans l'enum child_section_new
-- Cette migration supprime l'ancienne valeur et ajoute la nouvelle avec la bonne casse

-- D'abord, vérifier les valeurs actuelles
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;

-- Supprimer l'ancienne valeur Maternelle_MS et ajouter maternelle_MS
-- Note: PostgreSQL ne permet pas de modifier directement les valeurs d'enum
-- Il faut créer un nouvel enum et migrer les données

-- Créer un nouvel enum temporaire avec la bonne casse
CREATE TYPE child_section_temp AS ENUM (
    'creche_etoile',
    'creche_nuage', 
    'creche_soleil',
    'garderie',
    'maternelle_PS1',
    'maternelle_PS2',
    'maternelle_MS',  -- Avec m minuscule
    'maternelle_GS'
);

-- Ajouter une colonne temporaire avec le nouvel enum
ALTER TABLE public.children 
ADD COLUMN section_temp child_section_temp;

ALTER TABLE public.groups 
ADD COLUMN section_temp child_section_temp;

-- Copier les données en corrigeant la casse
UPDATE public.children 
SET section_temp = CASE 
    WHEN section = 'Maternelle_MS' THEN 'maternelle_MS'::child_section_temp
    ELSE section::text::child_section_temp
END;

UPDATE public.groups 
SET section_temp = CASE 
    WHEN section = 'Maternelle_MS' THEN 'maternelle_MS'::child_section_temp
    ELSE section::text::child_section_temp
END;

-- Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE public.children DROP COLUMN section;
ALTER TABLE public.children RENAME COLUMN section_temp TO section;

ALTER TABLE public.groups DROP COLUMN section;
ALTER TABLE public.groups RENAME COLUMN section_temp TO section;

-- Supprimer l'ancien enum et renommer le nouveau
DROP TYPE child_section_new;
ALTER TYPE child_section_temp RENAME TO child_section_new;

-- Vérifier le résultat
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;

-- Afficher un rapport des changements
SELECT 'Rapport final - Table children:' as report_type;
SELECT section, COUNT(*) as count FROM public.children GROUP BY section ORDER BY section;

SELECT 'Rapport final - Table groups:' as report_type;
SELECT section, COUNT(*) as count FROM public.groups GROUP BY section ORDER BY section;
