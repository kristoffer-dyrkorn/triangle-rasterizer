import Vector from "../lib/vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let screenBuffer;
let fillRule = false;
let drawBlue = false;

window.addEventListener("resize", resize);
window.addEventListener("keydown", toggle);

resize();

const vertices = [];
vertices.push(new Vector(140, 100, 0));
vertices.push(new Vector(140, 40, 0));
vertices.push(new Vector(80, 40, 0));
vertices.push(new Vector(50, 90, 0));

const greenTriangleIndices = [0, 1, 2];
const greenTriangle = new Triangle(greenTriangleIndices, screenBuffer);

const blueTriangleIndices = [0, 2, 3];
const blueTriangle = new Triangle(blueTriangleIndices, screenBuffer);

const greenColor = new Vector(120, 240, 100);
const blueColor = new Vector(100, 180, 240);

greenTriangle.draw(vertices, greenColor, fillRule);
ctx.putImageData(screenBuffer, 0, 0);

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
}

function toggle(keyEvent) {
  if (keyEvent.key === " ") {
    drawBlue = !drawBlue;

    screenBuffer.data.fill(0);
    greenTriangle.draw(vertices, greenColor, fillRule);

    if (drawBlue) {
      blueTriangle.draw(vertices, blueColor, fillRule);
    }

    ctx.putImageData(screenBuffer, 0, 0);
  }

  if (keyEvent.key === "f") {
    fillRule = !fillRule;
  }
}
