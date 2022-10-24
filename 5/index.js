import Vector from "../lib/vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let screenBuffer;
let drawBlue = true;

let angle = 0;
let angleSpeed = 0.15;

window.addEventListener("resize", resize);
window.addEventListener("keydown", toggle);

resize();

const vertices = [];
vertices.push(new Vector(140, 100, 0));
vertices.push(new Vector(140, 40, 0));
vertices.push(new Vector(80, 40, 0));
vertices.push(new Vector(50, 90, 0));

const rotatedVertices = Array.from({ length: 4 }, () => new Vector());

const greenTriangleIndices = [0, 1, 2];
const greenTriangle = new Triangle(greenTriangleIndices, screenBuffer);

const blueTriangleIndices = [0, 2, 3];
const blueTriangle = new Triangle(blueTriangleIndices, screenBuffer);

const greenColor = new Vector(120, 240, 100);
const blueColor = new Vector(100, 180, 240);

const center = new Vector(110, 70, 0);

draw();

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
}

function rotate(angle) {
  const DEG_TO_RAD = Math.PI / 180;

  for (let i = 0; i < 4; i++) {
    const v = new Vector(vertices[i]);
    v.sub(center);

    const r = rotatedVertices[i];
    r[0] = Math.round(v[0] * Math.cos(angle * DEG_TO_RAD) - v[1] * Math.sin(angle * DEG_TO_RAD));
    r[1] = Math.round(v[0] * Math.sin(angle * DEG_TO_RAD) + v[1] * Math.cos(angle * DEG_TO_RAD));

    r.add(center);
  }
}

function draw() {
  requestAnimationFrame(draw);

  rotate(angle);
  screenBuffer.data.fill(0);
  greenTriangle.draw(rotatedVertices, greenColor);

  if (drawBlue) {
    blueTriangle.draw(rotatedVertices, blueColor);
  }

  ctx.putImageData(screenBuffer, 0, 0);
  angle += angleSpeed;
}

function toggle(keyEvent) {
  if (keyEvent.key === " ") {
    drawBlue = !drawBlue;
  }

  if (keyEvent.key === "p") {
    if (angleSpeed != 0) {
      angleSpeed = 0;
    } else {
      angleSpeed = 0.15;
    }
  }
}
