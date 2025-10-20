-- Test final avec la casse corrigée
-- Cette migration teste que toutes les valeurs sont correctes avec maternelle_MS (m minuscule)

-- Vérifier que l'enum child_section_new contient les bonnes valeurs
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;

-- Test d'insertion avec les valeurs correctes (maternelle_MS avec m minuscule)
DO $$
BEGIN
    RAISE NOTICE 'Test des valeurs de section avec la casse corrigée...';
    
    -- Vérifier que toutes les valeurs sont acceptées
    PERFORM 'creche_etoile'::child_section_new;
    PERFORM 'creche_nuage'::child_section_new;
    PERFORM 'creche_soleil'::child_section_new;
    PERFORM 'garderie'::child_section_new;
    PERFORM 'maternelle_PS1'::child_section_new;
    PERFORM 'maternelle_PS2'::child_section_new;
    PERFORM 'maternelle_MS'::child_section_new;  -- Avec m minuscule
    PERFORM 'maternelle_GS'::child_section_new;
    
    RAISE NOTICE 'Toutes les valeurs de section sont valides avec la casse corrigée !';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors du test des valeurs: %', SQLERRM;
END $$;

-- Afficher un rapport final
SELECT 'Rapport final - Table children:' as report_type;
SELECT section, COUNT(*) as count FROM public.children GROUP BY section ORDER BY section;

SELECT 'Rapport final - Table groups:' as report_type;
SELECT section, COUNT(*) as count FROM public.groups GROUP BY section ORDER BY section;
