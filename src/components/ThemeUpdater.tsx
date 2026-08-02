import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";

export default function ThemeUpdater() {
  var scene = useThree(function (s) { return s.scene; });

  useEffect(function () {
    function update() {
      var light = window.matchMedia("(prefers-color-scheme: light)").matches;
      scene.background = new Color(0xff0000);
    }
    update();
    var mql = window.matchMedia("(prefers-color-scheme: light)");
    mql.addEventListener("change", update);
    return function () { mql.removeEventListener("change", update); };
  }, [scene]);

  return null;
}
