-- Vérifier les valeurs exactes de l'enum child_section_new
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;
