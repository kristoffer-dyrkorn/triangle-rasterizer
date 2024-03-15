import FixedPointVector from "../lib/fixedpointvector.js";

export default class Triangle {
  constructor(vertexIndices, screenBuffer, screenSize) {
    this.buffer = screenBuffer;

    this.va = vertexIndices[0];
    this.vb = vertexIndices[1];
    this.vc = vertexIndices[2];

    this.screenSize = screenSize;
    this.startBuffer = new Uint32Array(screenSize[1]);
    this.endBuffer = new Uint32Array(screenSize[1]);
  }

  floating_point_scan(start, end, buffer) {
    let x = start[0];
    const dx = (end[0] - start[0]) / (end[1] - start[1]);
    for (let y = start[1]; y <= end[1]; y++) {
      buffer[y] = x;
      x += dx;
    }
  }

  scan(start, end) {
    let dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const edgeBuffer = new Uint16Array(dy >> FixedPointVector.SHIFT);
    let bufferIndex = 0;

    let signdx = 1;

    if (dx < 0) {
      signdx = -1;
      dx = -dx;
    }

    let x = start[0];
    let y = start[1];

    let nominator = 0;

    if (dy > dx) {
      // y is longest axis, loop for each y
      while (y < end[1]) {
        y++;
        nominator += dx;
        if (nominator >= dy) {
          x += signdx;
          nominator -= dy;
        }
        // write out x-value at center y of pixel
        if ((y & 15) == FixedPointVector.HALF) {
          edgeBuffer[bufferIndex] = x >> FixedPointVector.SHIFT;
          bufferIndex++;
        }
      }
      edgeBuffer[bufferIndex] = x >> FixedPointVector.SHIFT;
    } else {
      // x is longest axis, loop for each x
      // by checking for != we don't need to special case positive/negative x directions
      while (x != end[0]) {
        x += signdx;
        nominator += dy;
        if (nominator >= dx) {
          y++;
          nominator -= dx;
          // write out x-value at center y of pixel
          if ((y & 15) == FixedPointVector.HALF) {
            edgeBuffer[bufferIndex] = x >> FixedPointVector.SHIFT;
            bufferIndex++;
          }
        }
      }
      edgeBuffer[bufferIndex] = x >> FixedPointVector.SHIFT;
    }

    return edgeBuffer;
  }

  scanEdge(a, b, v) {
    let key;

    // key pattern: smaller index - bigger index
    if (a < b) {
      key = `${a}-${b}`;
    } else {
      key = `${b}-${a}`;
    }

    //    edge = Triangle.edges.get(key);

    if (!edge) {
      if (v[a][1] > v[b][1]) {
        // scan edges downward, ie along increasing y from a to b
        // swap coords if needed
        const temp = a;
        a = b;
        b = temp;
      }

      Triangle.edges.set(key, this.scan(v[a], v[b]));
    }
  }

  // assumes floating point coordinates and ccw vertex order
  draw(coordinates, color) {
    const v = [];

    v[0] = new FixedPointVector(coordinates[this.va]);
    v[1] = new FixedPointVector(coordinates[this.vb]);
    v[2] = new FixedPointVector(coordinates[this.vc]);

    const ab = [v[1][0] - v[0][0], v[1][1] - v[0][1]];
    const ac = [v[2][0] - v[0][0], v[2][1] - v[0][1]];

    // backface culling
    if (ab[1] * ac[0] - ab[0] * ac[1] <= 0) {
      return;
    }

    // TODO: viewport clipping
    // treat start and end buffer y coordinate as relative to top triangle vertex
    // (so, we let edge rasterization work on triangle parts above screen)
    // if min y is above screen, just skip over the line in the loop, while incrementing z buffer deltas
    // start at first on-screen row when drawing horizontal lines, then
    // loop until max y (or the screen buffer max y) is reached, so we clip bottom tris
    // do the same for horiz drawing (clamp between 0 and xmax-1)

    // question: to jump/skip forward to the zero intersection, or to just loop until reached?
    // question is whether rasterizer should work on calculating data that will be unused
    // vs the cost of calculating the zero crossing (it will mean a divide, likely)

    this.scan(0, 1, v);
    this.scan(1, 2, v);
    this.scan(2, 0, v);

    const ymin = Math.min(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;
    const ymax = Math.max(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;

    // initial screen buffer index: x=0, y=ymin
    let imageOffset = ymin * this.screenSize[0];

    // bake final color as int32 RGBA value (little-endian)
    let finalColor = 255 << 24;
    finalColor += color[2] << 16;
    finalColor += color[1] << 8;
    finalColor += color[0];

    // TODO: find the edges for the left and right sides
    // swap when passing a vertex

    // we start at ymin+1 due to "top left" rasterization rule
    let y = ymin + 1;
    while (y <= ymax) {
      // we start at xmin+1 due to "top left" rasterization rule
      let startx = this.startBuffer[y] + 1;
      let endx = this.endBuffer[y];
      while (startx <= endx) {
        // draw a pixel
        this.buffer[imageOffset + x] = finalColor;
        x++;
      }
      y++;
      // point to x=0 on next line
      imageOffset += this.screenSize[0];
    }
  }
}

Triangle.edges = new Map();
