import React from "react";
import { GLOBAL_CSS, SAFE_MOTION_CSS } from "../tokens/homeTokens.js";

export function HomeStyles() {
  return <style>{GLOBAL_CSS + SAFE_MOTION_CSS}</style>;
}
