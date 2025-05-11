import js from "@eslint/js";
import globals from "globals";
import jestPlugin from 'eslint-plugin-jest';

import {defineConfig} from "eslint/config";


export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: {js},
        extends: ["js/recommended"]
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        languageOptions:
            {
                globals: globals.browser
            }
    },
    {
        files: ['**/*.test.{js,mjs,cjs}', '**/__tests__/**/*.{js,mjs,cjs}'],
        plugins: {
          jest: jestPlugin
        },
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    }
]);