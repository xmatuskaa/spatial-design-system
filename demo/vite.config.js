// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [basicSsl()],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "lib/main.js"),
      name: "SpatialDesignSystem",
      // the proper extensions will be added
      fileName: "spatial-design-system",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["aframe"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          // aframe
          aframe: "AFRAME",
        },
      },
    },
  },
});
