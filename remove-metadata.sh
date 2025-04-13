#!/bin/bash

# Find all page.tsx files in the protected directory that have both "use client" and metadata exports
PAGES=$(find /Users/jihunkong/meta-cog-6/src/app/\(protected\) -name "page.tsx" -exec grep -l "\"use client\"" {} \; | xargs grep -l "export const metadata")

for PAGE in $PAGES; do
  echo "Removing metadata export from $PAGE"
  # Use sed to remove the metadata export block
  sed -i '' '/export const metadata/,/};/d' "$PAGE"
  # Remove the import for Metadata if it exists
  sed -i '' '/import.*Metadata.*from.*next.*/d' "$PAGE"
done

echo "Finished removing metadata exports from all client pages"
