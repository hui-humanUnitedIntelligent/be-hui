import { useEffect } from "react";
import IntroVideoScreen from "../components/entry/IntroVideoScreen.jsx";

export default function SplashScreen() {
  // SplashScreen ist jetzt nur noch der Router-Einstiegspunkt.
  // IntroVideoScreen übernimmt das Video-Playback und leitet danach zu /login weiter.
  // Wenn das Video schon abgespielt wurde (first-launch mode), leitet IntroVideoScreen
  // sofort zu /login weiter — kein pulsierendes Logo mehr.
  return <IntroVideoScreen />;
}
