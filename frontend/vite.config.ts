// import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// import tailwindcss from "@tailwindcss/vite";
// import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// export default defineConfig({
//   vite: {
//     resolve: {
//       tsconfigPaths: true,
//     },
//   },
//   plugins: [
//     TanStackRouterVite({
//       target: "react",
//       autoCodeSplitting: false,
//       routesDirectory: "./src/routes",
//       generatedRouteTree: "./src/routeTree.gen.ts",
//     }),
//     tailwindcss(),
//   ],
// });
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
  },
  plugins: [
    tailwindcss(),
  ],
});