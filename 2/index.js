const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let screenBuffer;

window.addEventListener("resize", resize);

resize();

/* 

 Application code goes here

*/

ctx.putImageData(screenBuffer, 0, 0);

function resize() {
  const devicePixelRatio = 0.2;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  screenBuffer = ctx.createImageData(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
}
