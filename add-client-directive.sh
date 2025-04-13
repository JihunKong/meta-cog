#!/bin/bash

# Find all page.tsx files in the protected directory
PAGES=$(find /Users/jihunkong/meta-cog-6/src/app/\(protected\) -name "page.tsx")

for PAGE in $PAGES; do
  # Check if the file already has "use client" directive
  if ! grep -q "\"use client\"" "$PAGE"; then
    echo "Adding 'use client' directive to $PAGE"
    # Create a temporary file with the new content
    echo "\"use client\";" > temp_file
    echo "" >> temp_file
    cat "$PAGE" >> temp_file
    # Replace the original file with the new content
    mv temp_file "$PAGE"
  else
    echo "$PAGE already has 'use client' directive"
  fi
done

echo "Finished adding 'use client' directives to all protected pages"
