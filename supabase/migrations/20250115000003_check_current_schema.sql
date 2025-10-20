-- Migration pour vérifier la structure actuelle de la base de données
-- et identifier quel enum est utilisé pour la colonne section

-- Vérifier les types d'enum existants
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%section%'
ORDER BY t.typname, e.enumsortorder;

-- Vérifier spécifiquement child_section_new
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;

-- Vérifier la structure de la table children
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'children' 
AND column_name = 'section';

-- Vérifier la structure de la table groups
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name = 'section';

-- Afficher les valeurs actuelles dans la colonne section de children
SELECT 
    section,
    COUNT(*) as count
FROM public.children 
GROUP BY section
ORDER BY section;

-- Afficher les valeurs actuelles dans la colonne section de groups
SELECT 
    section,
    COUNT(*) as count
FROM public.groups 
GROUP BY section
ORDER BY section;
