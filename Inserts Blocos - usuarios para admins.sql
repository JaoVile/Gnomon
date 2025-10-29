SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT * FROM mapas

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mapas';

INSERT INTO mapas ("name", "imageUrl", "createdAt", "updatedAt")
VALUES
    ('Mapa_Bloco_A', 'https://exemplo.com/imagens/mapa_bloco_a.png', NOW(), NOW()),
    ('Mapa_Bloco_B', 'https://exemplo.com/imagens/mapa_bloco_b.png', NOW(), NOW());


	SELECT * FROM mapas
	




	