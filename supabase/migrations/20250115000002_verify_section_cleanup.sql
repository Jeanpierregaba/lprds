-- Migration pour vérifier le nettoyage des valeurs de section
-- Cette migration affiche un rapport des valeurs de section dans les tables

-- Créer une fonction temporaire pour afficher les statistiques
CREATE OR REPLACE FUNCTION report_section_values()
RETURNS TABLE(
    table_name TEXT,
    section_value TEXT,
    count BIGINT
) AS $$
BEGIN
    -- Statistiques pour la table children
    RETURN QUERY
    SELECT 
        'children'::TEXT as table_name,
        COALESCE(section::TEXT, 'NULL') as section_value,
        COUNT(*) as count
    FROM public.children 
    GROUP BY section
    ORDER BY section;
    
    -- Statistiques pour la table groups
    RETURN QUERY
    SELECT 
        'groups'::TEXT as table_name,
        COALESCE(section::TEXT, 'NULL') as section_value,
        COUNT(*) as count
    FROM public.groups 
    GROUP BY section
    ORDER BY section;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le rapport
SELECT * FROM report_section_values();

-- Nettoyer la fonction temporaire
DROP FUNCTION report_section_values();

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration de nettoyage des sections terminée. Vérifiez les résultats ci-dessus.';
END $$;
