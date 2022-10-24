import Vector from "../lib/vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let screenBuffer;

window.addEventListener("resize", resize);

resize();

const vertices = [];

vertices.push(new Vector(140, 100, 0));
vertices.push(new Vector(140, 40, 0));
vertices.push(new Vector(80, 40, 0));

const greenTriangleIndices = [0, 1, 2];
const greenTriangle = new Triangle(greenTriangleIndices, screenBuffer);

const color = new Vector(120, 240, 100);

greenTriangle.draw(vertices, color);

ctx.putImageData(screenBuffer, 0, 0);

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
}
