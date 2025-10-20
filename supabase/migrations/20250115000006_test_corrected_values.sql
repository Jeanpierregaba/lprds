-- Test de la migration corrigée
-- Cette migration teste que toutes les valeurs sont correctes

-- Vérifier que l'enum child_section_new contient les bonnes valeurs
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'child_section_new'
ORDER BY e.enumsortorder;

-- Test d'insertion avec les valeurs correctes
DO $$
BEGIN
    -- Test avec Maternelle_MS (avec M majuscule)
    RAISE NOTICE 'Test des valeurs de section...';
    
    -- Vérifier que toutes les valeurs sont acceptées
    PERFORM 'creche_etoile'::child_section_new;
    PERFORM 'creche_nuage'::child_section_new;
    PERFORM 'creche_soleil'::child_section_new;
    PERFORM 'garderie'::child_section_new;
    PERFORM 'maternelle_PS1'::child_section_new;
    PERFORM 'maternelle_PS2'::child_section_new;
    PERFORM 'Maternelle_MS'::child_section_new;
    PERFORM 'maternelle_GS'::child_section_new;
    
    RAISE NOTICE 'Toutes les valeurs de section sont valides !';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors du test des valeurs: %', SQLERRM;
END $$;
