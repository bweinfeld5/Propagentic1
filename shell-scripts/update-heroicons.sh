#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


echo "Updating Heroicons imports from v1 to v2 format..."

# Find and update all files with old Heroicons imports - solid
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "@heroicons/react/solid" {} \; | while read file; do
  echo "Processing solid icons in $file..."
  
  # Replace import path
  sed -i '' 's|@heroicons/react/solid|@heroicons/react/24/solid|g' "$file"
  
  # Replace icon names that have changed
  sed -i '' 's/XIcon/XMarkIcon/g' "$file"
  sed -i '' 's/ExclamationIcon/ExclamationTriangleIcon/g' "$file"
  sed -i '' 's/MenuIcon/Bars3Icon/g' "$file"
  sed -i '' 's/MenuAlt2Icon/Bars3BottomLeftIcon/g' "$file"
  sed -i '' 's/DocumentAddIcon/DocumentPlusIcon/g' "$file"
  sed -i '' 's/DotsVerticalIcon/EllipsisVerticalIcon/g' "$file"
  sed -i '' 's/BadgeCheckIcon/CheckBadgeIcon/g' "$file"
  sed -i '' 's/LightningBoltIcon/BoltIcon/g' "$file"
  sed -i '' 's/ClipboardListIcon/ClipboardDocumentListIcon/g' "$file"
done

# Find and update all files with old Heroicons imports - outline
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "@heroicons/react/outline" {} \; | while read file; do
  echo "Processing outline icons in $file..."
  
  # Replace import path
  sed -i '' 's|@heroicons/react/outline|@heroicons/react/24/outline|g' "$file"
  
  # Replace icon names that have changed
  sed -i '' 's/ClipboardListIcon/ClipboardDocumentListIcon/g' "$file"
  sed -i '' 's/XIcon/XMarkIcon/g' "$file"
  sed -i '' 's/ExclamationIcon/ExclamationTriangleIcon/g' "$file"
  sed -i '' 's/MenuIcon/Bars3Icon/g' "$file"
  sed -i '' 's/MenuAlt2Icon/Bars3BottomLeftIcon/g' "$file"
  sed -i '' 's/DocumentAddIcon/DocumentPlusIcon/g' "$file"
  sed -i '' 's/DotsVerticalIcon/EllipsisVerticalIcon/g' "$file"
  sed -i '' 's/BadgeCheckIcon/CheckBadgeIcon/g' "$file"
  sed -i '' 's/LightningBoltIcon/BoltIcon/g' "$file"
done

echo "Heroicons imports updated successfully!" 