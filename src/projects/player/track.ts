import src from "./assets/demo.mp3";
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
  src,
  cover,
};
