-- Migration adaptative pour nettoyer les valeurs de section
-- Cette migration s'adapte selon l'enum trouvé (child_section ou child_section_new)

DO $$
DECLARE
    section_enum_name TEXT;
    has_child_section_new BOOLEAN := FALSE;
    has_child_section BOOLEAN := FALSE;
BEGIN
    -- Vérifier quel enum existe
    SELECT EXISTS(
        SELECT 1 FROM pg_type WHERE typname = 'child_section_new'
    ) INTO has_child_section_new;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_type WHERE typname = 'child_section'
    ) INTO has_child_section;
    
    -- Déterminer quel enum utiliser (priorité à child_section_new)
    IF has_child_section_new THEN
        section_enum_name := 'child_section_new';
        RAISE NOTICE 'Utilisation de l''enum child_section_new';
    ELSIF has_child_section THEN
        section_enum_name := 'child_section';
        RAISE NOTICE 'Utilisation de l''enum child_section';
    ELSE
        RAISE EXCEPTION 'Aucun enum de section trouvé (child_section ou child_section_new)';
    END IF;
    
    -- Nettoyer les données dans la table children
    RAISE NOTICE 'Nettoyage des données dans la table children...';
    
    -- Mettre à jour les anciennes valeurs vers les nouvelles
    EXECUTE format('UPDATE public.children SET section = ''creche_etoile'' WHERE section = ''creche''');
    EXECUTE format('UPDATE public.children SET section = ''maternelle_PS1'' WHERE section = ''maternelle_etoile''');
    EXECUTE format('UPDATE public.children SET section = ''maternelle_PS2'' WHERE section = ''maternelle_soleil''');
    
    -- Corriger la casse de Maternelle_MS vers maternelle_MS
    EXECUTE format('UPDATE public.children SET section = ''maternelle_MS'' WHERE section = ''Maternelle_MS''');
    
    -- Mettre les valeurs invalides à 'garderie' par défaut
    EXECUTE format('UPDATE public.children SET section = ''garderie'' WHERE section NOT IN (''creche_etoile'', ''creche_nuage'', ''creche_soleil'', ''garderie'', ''maternelle_PS1'', ''maternelle_PS2'', ''maternelle_MS'', ''maternelle_GS'')');
    
    -- Nettoyer les données dans la table groups
    RAISE NOTICE 'Nettoyage des données dans la table groups...';
    
    EXECUTE format('UPDATE public.groups SET section = ''creche_etoile'' WHERE section = ''creche''');
    EXECUTE format('UPDATE public.groups SET section = ''maternelle_PS1'' WHERE section = ''maternelle_etoile''');
    EXECUTE format('UPDATE public.groups SET section = ''maternelle_PS2'' WHERE section = ''maternelle_soleil''');
    
    -- Corriger la casse de Maternelle_MS vers maternelle_MS
    EXECUTE format('UPDATE public.groups SET section = ''maternelle_MS'' WHERE section = ''Maternelle_MS''');
    
    EXECUTE format('UPDATE public.groups SET section = ''garderie'' WHERE section NOT IN (''creche_etoile'', ''creche_nuage'', ''creche_soleil'', ''garderie'', ''maternelle_PS1'', ''maternelle_PS2'', ''maternelle_MS'', ''maternelle_GS'')');
    
    RAISE NOTICE 'Nettoyage terminé pour l''enum: %', section_enum_name;
END $$;

-- Afficher un rapport final
SELECT 'Rapport final - Table children:' as report_type;
SELECT section, COUNT(*) as count FROM public.children GROUP BY section ORDER BY section;

SELECT 'Rapport final - Table groups:' as report_type;
SELECT section, COUNT(*) as count FROM public.groups GROUP BY section ORDER BY section;
