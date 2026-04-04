-- AlterTable
ALTER TABLE "price_groups" ADD COLUMN "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Populate allowed_categories for "Прайс Субы"
UPDATE "price_groups"
SET "allowed_categories" = ARRAY[
  'Jaws',
  'Jaws Розлив',
  'Бродилка сид��ы',
  'Бродилка сидры Розлив',
  'Полукультурка си��ры',
  'Полукультурка сидры Розлив'
]
WHERE "name" = 'Прайс Субы';
