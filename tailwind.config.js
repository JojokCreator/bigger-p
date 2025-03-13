import defaultTheme from "tailwindcss/defaultTheme";

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      //   typography: {
      //     DEFAULT: {
      //       css: {
      //         a: {
      //           color: "#332ebd",
      //           "&:hover": {
      //             color: "#553c9e",
      //           },
      //         },
      //       },
      //     },
      //   },
      colors: {
        primary: "#553c9e",
        primaryLight: "#b4a1f0",
        primaryOnBlack: "#7E58EE",
        primaryDark: "#3A3254",
        highlight: "#257A6F",
        blue: "#332ebd",
        silver: "#b3afb3",
        dark: "#1a1a1a",
        menuDark: "#161616",
        mute: "#e0e0e0",
        muteDark: "#dbdbdb",
      },
      cursor: {
        zoom: "url(/magnify.svg), zoom-in",
      },
      fontFamily: {
        sans: ["Montserrat Variable", ...defaultTheme.fontFamily.sans],
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        "bp-bar": "bp-bar 4s both",
        "bp-o": "bp-o 1s infinite linear",
        "bp-fadein": "bp-fadein 1s ease-in-out",
        "bp-fadeinslow": "bp-fadein 0.2s ease-in-out",
        border: "border 8s linear infinite",
        "fade-left": "fade-left 0.5s ease-in-out",
        "fade-right": "fade-right 0.5s ease-in-out",
      },
      keyframes: {
        "fade-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        border: {
          to: { "--border-angle": "360deg" },
        },
        "bp-fadein": {
          "0%": { opacity: "0.01" },
          "100%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0%" },
          "100%": { opacity: "100%" },
        },
        "bp-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "bp-o": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "button-pop": {
          "0%": {
            transform: "scale(1, 0.98)",
          },
          "40%": {
            transform: "scale(1.02)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
      },
      transitionTimingFunction: {
        image: "cubic-bezier(0, 0, 0.5, 1.0)",
        accordion: "cubic-bezier(0.42, 0, 0.58, 1)",
      },
      maxWidth: {
        "8xl": "84rem",
      },
    },
  },
  //   plugins: [
  //     plugin(function ({ addVariant, addUtilities }) {
  //       addVariant("dialog-open", "&[open]");
  //       addVariant("starting", "@starting-style");
  //       addUtilities({
  //         ".transition-discrete": {
  //           transitionBehavior: "allow-discrete",
  //         },
  //       }),
  //         addUtilities({
  //           ".bleed-right": {
  //             transform:
  //               "translateX(calc((max(84rem, 100vw)) / 2 - calc(84rem / 2)))",
  //           },
  //         });
  //     }),
  //   ],
};
