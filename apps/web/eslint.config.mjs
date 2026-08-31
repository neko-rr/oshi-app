import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const lucideDirectImportMessage =
  "lucide-react 直 import 禁止。named import は @/lib/icons から（docs/design/icons.md）。";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/icons.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message: lucideDirectImportMessage,
            },
            {
              name: "react-icons",
              message:
                "react-icons 禁止。lucide は @/lib/icons から named import（docs/design/icons.md）。",
            },
            {
              name: "@radix-ui/react-icons",
              message:
                "@radix-ui/react-icons 禁止。@/lib/icons の lucide を使え。",
            },
          ],
          patterns: [
            {
              group: ["react-icons/*"],
              message:
                "react-icons 禁止。@/lib/icons の lucide を使え（docs/design/icons.md）。",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value='lucide-react'] ImportNamespaceSpecifier",
          message:
            "lucide-react の import * 禁止。使うアイコンだけ @/lib/icons から named import。",
        },
      ],
    },
  },
];

export default eslintConfig;
