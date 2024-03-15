import Vector from "../lib/vector.js";
import Triangle from "./triangle.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let imageData;
let screenBuffer;
let screenSize;
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
const greenTriangle = new Triangle(
  greenTriangleIndices,
  screenBuffer,
  screenSize
);

const blueTriangleIndices = [0, 2, 3];
const blueTriangle = new Triangle(
  blueTriangleIndices,
  screenBuffer,
  screenSize
);

const greenColor = new Vector(120, 240, 100);
const blueColor = new Vector(100, 180, 240);

const center = new Vector(110, 70, 0);

let frameCounter = 0;
let triangleDrawTime = 0;

draw();

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  imageData = ctx.createImageData(
    window.innerWidth * devicePixelRatio,
    window.innerHeight * devicePixelRatio
  );

  const arrayBuffer = imageData.data.buffer;
  screenBuffer = new Uint32Array(arrayBuffer);
  screenSize = [imageData.width, imageData.height];
}

function rotate() {
  const DEG_TO_RAD = Math.PI / 180;

  for (let i = 0; i < 4; i++) {
    const v = new Vector(vertices[i]);
    v.sub(center);

    const r = rotatedVertices[i];
    r[0] =
      v[0] * Math.cos(angle * DEG_TO_RAD) - v[1] * Math.sin(angle * DEG_TO_RAD);
    r[1] =
      v[0] * Math.sin(angle * DEG_TO_RAD) + v[1] * Math.cos(angle * DEG_TO_RAD);

    r.add(center);
  }
}

function draw() {
  requestAnimationFrame(draw);

  screenBuffer.fill(0);

  let start = performance.now();
  greenTriangle.draw(rotatedVertices, greenColor);
  triangleDrawTime += performance.now() - start;

  if (frameCounter % 100 == 0) {
    console.log(
      `Triangle time: ${(triangleDrawTime / frameCounter).toFixed(2)} ms`
    );
  }

  if (drawBlue) {
    blueTriangle.draw(rotatedVertices, blueColor);
  }

  ctx.putImageData(imageData, 0, 0);

  angle += angleSpeed;
  frameCounter++;
  rotate();
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
