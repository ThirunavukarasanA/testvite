import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
export default defineConfig({
  // base: "/testvite/",
  plugins: [react()],
    server: {
    // host: "192.168.0.105",
    // host: "192.168.101.206",
    // host: "192.168.67.7",
    host: "192.168.67.6",
    port: "3040",
  },
});
