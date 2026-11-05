import React from "react";
import { Composition, registerRoot } from "remotion";
import { Film } from "./Film";
const Root = () =>
  React.createElement(Composition, {
    id: "Airport180",
    component: Film,
    durationInFrames: 5400,
    fps: 30,
    width: 1920,
    height: 1080,
  });
registerRoot(Root);
