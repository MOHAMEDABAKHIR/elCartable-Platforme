// À fusionner dans ton tailwind.config.js existant, dans theme.extend

module.exports = {
  theme: {
    extend: {
      animation: {
        "infinite-scroll": "infinite-scroll var(--scroll-duration, 30s) linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
    },
  },
};