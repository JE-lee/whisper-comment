/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./demo.html", "./index.html"],
  theme: {
    extend: {
      animation: {
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "like-bounce": "like-bounce 0.6s ease-in-out",
        "dislike-bounce": "dislike-bounce 0.6s ease-in-out",
      },
      keyframes: {
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out": {
          from: {
            opacity: "1",
            transform: "translateY(0)",
          },
          to: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
        },
        "slide-down": {
          from: {
            transform: "translateY(-10px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "like-bounce": {
          "0%, 20%, 53%, 80%, 100%": {
            transform: "scale(1)",
          },
          "40%, 43%": {
            transform: "scale(1.1)",
          },
        },
        "dislike-bounce": {
          "0%, 20%, 53%, 80%, 100%": {
            transform: "scale(1)",
          },
          "40%, 43%": {
            transform: "scale(1.1) rotateZ(-5deg)",
          },
        },
      },
    },
  },
  plugins: [],
  // 启用 preflight 以获得一致的基础样式
  corePlugins: {
    preflight: true, // 启用 CSS reset
  },
};
