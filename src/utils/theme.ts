import chroma from "chroma-js";

export type CustomTheme = {
  bgColor: string;
  helpBgColor: string;
  helpQuestionTextColor: string;
  helpTextColor: string;
  aiTextColor: string;
  userTextColor: string;
};

export function getContrastingText(bg: string) {
  return chroma(bg).luminance() > 0.5 ? "#111111" : "#FFFFFF";
}

export function generateThemeFromBg(bgColor: string): CustomTheme {
  return {
    bgColor,
    helpBgColor: chroma(bgColor).brighten(1).hex(),
    helpQuestionTextColor: getContrastingText(chroma(bgColor).brighten(1).hex()),
    helpTextColor: chroma(bgColor).darken(1.5).hex(),
    aiTextColor: getContrastingText(bgColor),
    userTextColor: getContrastingText(bgColor),
  };
}
