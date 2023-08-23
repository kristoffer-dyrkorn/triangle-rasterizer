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

  scan(start, end, buffer) {
    let dx = end[0] - start[0];
    const dy = end[1] - start[1];

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
        // only write x-value for each new whole pixel
        // if y % 16 = 0 => if y & 15 == 0 => if !(y & 15)
        if (!(y & (FixedPointVector.MULTIPLIER - 1))) {
          buffer[y >> FixedPointVector.SHIFT] = x >> FixedPointVector.SHIFT;
        }
      }
    } else {
      // x is longest axis, loop for each x
      // by checking for != we don't need to special case positive/negative x directions
      while (x != end[0]) {
        x += signdx;
        nominator += dy;
        if (nominator >= dx) {
          y++;
          nominator -= dx;
          // only write x-value for each new whole pixel
          // if y % 16 = 0 => if y & 15 == 0 => if !(y & 15)
          if (!(y & (FixedPointVector.MULTIPLIER - 1))) {
            buffer[y >> FixedPointVector.SHIFT] = x >> FixedPointVector.SHIFT;
          }
        }
      }
    }
  }

  findEdges(a, b, v) {
    // if vertex a is above vertex b then edge a->b is a left edge
    if (v[a][1] < v[b][1]) {
      this.scan(v[a], v[b], this.startBuffer);
    } else if (v[a][1] > v[b][1]) {
      // or, if vertex b is above vertex a then edge b->a is a right edge
      this.scan(v[b], v[a], this.endBuffer);
      // note: if vertex a and b form a horizontal edge, we can ignore that case,
      // since we will not need to scan the edge.
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

    this.findEdges(0, 1, v);
    this.findEdges(1, 2, v);
    this.findEdges(2, 0, v);

    const ymin = Math.min(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;
    const ymax = Math.max(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;

    // initial screen buffer index: x=0, y=ymin
    let imageOffset = ymin * this.screenSize[0];

    // bake final color as int32 RGBA value (little-endian)
    let finalColor = 255 << 24;
    finalColor += color[2] << 16;
    finalColor += color[1] << 8;
    finalColor += color[0];

    // we start at ymin+1 due to "top left" rasterization rule
    let y = ymin + 1;
    while (y <= ymax) {
      // we start at xmin+1 due to "top left" rasterization rule
      let x = this.startBuffer[y] + 1;
      while (x <= this.endBuffer[y]) {
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
