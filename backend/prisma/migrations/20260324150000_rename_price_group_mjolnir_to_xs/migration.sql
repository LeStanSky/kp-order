-- Rename price group "Прайс спец мьельнир" → "Прайс ХС"
UPDATE price_groups SET name = 'Прайс ХС' WHERE name = 'Прайс спец мьельнир';
