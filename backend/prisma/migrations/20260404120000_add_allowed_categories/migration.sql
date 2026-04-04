-- AlterTable
ALTER TABLE "price_groups" ADD COLUMN "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Populate allowed_categories for "Прайс Субы"
UPDATE "price_groups"
SET "allowed_categories" = ARRAY[
  'Jaws',
  'Jaws розлив',
  'Бродилка сидры',
  'Бродилка сидры Розлив',
  'Полукультурка сидры',
  'Полукультурка сидры розлив'
]
WHERE "name" = 'Прайс Субы';
