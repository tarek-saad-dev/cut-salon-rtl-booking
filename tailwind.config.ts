import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        heading: ["Cairo", "sans-serif"],
        body: ["Tajawal", "sans-serif"],
        display: ["Oswald", "sans-serif"],
        editorial: ["Playfair Display", "serif"],
      },
      colors: {
        cut: {
          black: "#050505",
          "soft-black": "#0A0807",
          espresso: "#0F0C0B",
          "wine-black": "#170406",
          "burgundy-dark": "#2F050C",
          burgundy: "#4A000F",
          ivory: "#FCF9ED",
          "soft-ivory": "#F4EBDD",
          "warm-paper": "#EFE4D2",
          "muted-paper": "#D8C7B3",
          white: "#FFFFFF",
          bronze: "#A48879",
          "warm-beige": "#D2B7A3",
          "green-muted": "#273C2C",
          /* Classic Cut yellow — booking CTA / modal accent */
          gold: "#D4AF37",
          green: "#2F050C",
          surface: "#0F0C0B",
          "surface-elevated": "#170406",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "surface-elevated": "hsl(var(--surface-elevated))",
        "gold-glow": "hsl(var(--gold-glow))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.375rem",
      },
      boxShadow: {
        "cut-card": "0 12px 40px rgba(0, 0, 0, 0.45)",
        "cut-glow": "0 0 28px rgba(212, 175, 55, 0.35)",
        "cut-glow-strong": "0 0 48px rgba(212, 175, 55, 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bronze-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(164, 136, 121, 0.15)" },
          "50%": { boxShadow: "0 0 30px rgba(164, 136, 121, 0.28)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(212, 175, 55, 0.25)" },
          "50%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.45)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "bronze-pulse": "bronze-pulse 2s ease-in-out infinite",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
