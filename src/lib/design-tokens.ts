export const designTokens = {
  color: {
    canvas: "#151515",
    canvasLight: "#f7f7f2",
    surface: "#202020",
    ink: "#151515",
    paper: "#f7f7f2",
    accent: "#ff6f61",
    success: "#2f8f56",
    violet: "#7c4dff"
  },
  radius: {
    sm: "14px",
    md: "18px",
    lg: "24px",
    pill: "999px"
  },
  spacing: {
    pageX: "24px",
    bottomNav: "92px",
    safeTop: "var(--safe-top)",
    safeBottom: "var(--safe-bottom)"
  },
  typography: {
    family: {
      cairo: '"Cairo", Tahoma, Arial, sans-serif',
      amiri: '"Amiri Quran", "Cairo", Tahoma, Arial, sans-serif'
    },
    noteScaleMin: 0.85,
    noteScaleMax: 1.25,
    lineHeightMin: 0.9,
    lineHeightMax: 1.25
  },
  motion: {
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    pressScale: 0.98
  }
} as const;
