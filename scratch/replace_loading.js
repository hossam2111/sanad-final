const fs = require('fs');

const files = [
  'admin.tsx', 'ai-control.tsx', 'citizen.tsx', 'doctor.tsx', 'emergency.tsx', 'family.tsx',
  'hospital.tsx', 'insurance.tsx', 'lab.tsx', 'pharmacy.tsx', 'research.tsx', 'supply-chain.tsx'
];

for (const file of files) {
  const path = 'artifacts/sanad/src/screens/' + file;
  let content = fs.readFileSync(path, 'utf8');

  // Add SkeletonCard, ErrorBanner to shared imports
  if (!content.includes('SkeletonCard')) {
    content = content.replace(/import\s*\{([^}]*?)\}\s*from\s*"@\/components\/shared";/s, (match, p1) => {
      return `import {${p1}, SkeletonCard, ErrorBanner} from "@/components/shared";`;
    });
  }

  const spinnerRegex1 = /\{\s*isLoading\s*&&\s*\(\s*<div className="flex items-center gap-3 py-16 text-muted-foreground justify-center">[\s\S]*?<\/div>\s*\)\s*\}/g;
  content = content.replace(spinnerRegex1, '{isLoading && <div className="p-5"><SkeletonCard rows={3} /></div>}');

  const spinnerRegex2 = /if\s*\(isLoading\)\s*\{\s*return\s*\(\s*(<Layout[^>]*>)\s*<div className="flex items-center gap-3 py-16 text-muted-foreground justify-center">[\s\S]*?<\/div>\s*(<\/Layout>)\s*\);\s*\}/g;
  content = content.replace(spinnerRegex2, 'if (isLoading) {\n    return (\n      $1\n        <div className="p-5"><SkeletonCard rows={3} /></div>\n      $2\n    );\n  }');

  fs.writeFileSync(path, content, 'utf8');
}
