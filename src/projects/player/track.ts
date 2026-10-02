import src from "./assets/demo.flac";
import mobileSrc from "./assets/demo.mp3";
import cover from "./assets/cover.png";

export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover: string;
}

export const track: Track = {
  id: "demo",
  title: "Demo",
  artist: "Pet projects",
  src: typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent)
    ? mobileSrc
    : src,
  cover,
};
