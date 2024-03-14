import FixedPointVector from "../lib/fixedpointvector.js";

export default class Triangle {
  constructor(vertexIndices, screenBuffer, screenSize) {
    this.buffer = screenBuffer;

    this.va = vertexIndices[0];
    this.vb = vertexIndices[1];
    this.vc = vertexIndices[2];

    this.screenSize = screenSize;
    this.startBuffer = new Int32Array(screenSize[1]);
    this.endBuffer = new Int32Array(screenSize[1]);
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

    // amount to step the x coordinate per iteration
    // the value is 1.0, in fixed point coordinates
    let pixel_step = FixedPointVector.ONE;

    // insert the end edge value into the buffer, this makes the loops simpler
    buffer[end[1] >> FixedPointVector.SHIFT] = end[0];

    // for now, calculate the numerator as if the y-axis is the major axis
    // the value will be adjusted if the x-axis is the major axis
    let numerator =
      (dy * (start[0] & 15) - dx * (start[1] & 15)) >> FixedPointVector.SHIFT;

    // use absolute values to simplify the loops
    if (dx < 0) {
      pixel_step = -pixel_step;
      dx = -dx;
      numerator = -numerator;
    }

    // dy is always positive, and since we have modified dx to be its absolute value,
    // we can compare them directly (no need to do abs(dy) > abs(dx))
    if (dy > dx) {
      // y is longest axis, loop for each y

      // set up loop vars
      // y and endy are integer pixel coordinates (conceptually at integer y + 0.5)
      // x is the coordinate (in fixed point) at (conceptually) integer y + 0.5
      // the initial numerator value is compensating for the fact that the y coordinate for
      // the start point is not in the pixel center
      let x = start[0];
      let y = start[1] >> FixedPointVector.SHIFT;
      let end_y = end[1] >> FixedPointVector.SHIFT;

      while (y < end_y) {
        y++;
        numerator += dx;
        if (numerator >= dy) {
          x += pixel_step;
          numerator -= dy;
        }
        buffer[y] = x;
      }
    } else {
      // x is longest axis, loop for each x

      // initial assumption was that y was major axis,
      // when x is major axis we need to reverse the sign
      numerator = -numerator;

      // set up loop vars
      // x and endx are fixed point pixel coordinates at integer x + 0.5
      // y is integer coordinate (conceptually sampled at integer y + 0.5)
      // the initial numerator value is compensating for the fact that the x coordinate for
      // the start point is not in the pixel center
      let x = (start[0] & ~15) + FixedPointVector.HALF;
      let y = start[1] >> FixedPointVector.SHIFT;
      let end_x = (end[0] & ~15) + FixedPointVector.HALF;

      // x is longest axis, loop for each x
      // by checking for != we don't need to special case positive/negative x directions
      while (x != end_x) {
        x += pixel_step;
        numerator += dy;
        if (numerator >= dx) {
          y++;
          numerator -= dx;
          buffer[y] = x;
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
    }
    // if vertex a and b have same y do nothing,
    // the edge is horizontal and does not need to be scan converted.
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

    this.findEdges(0, 1, v);
    this.findEdges(1, 2, v);
    this.findEdges(2, 0, v);

    let ymin = Math.min(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;
    let ymax = Math.max(v[0][1], v[1][1], v[2][1]) >> FixedPointVector.SHIFT;

    // vertical clip (bottom of screen)
    ymax = Math.min(ymax, this.screenSize[1] - 1);

    // initial screen buffer index: x=0, y=ymin
    let imageOffset = ymin * this.screenSize[0];

    // bake final color as int32 RGBA value (little-endian)
    let finalColor = 255 << 24;
    finalColor += color[2] << 16;
    finalColor += color[1] << 8;
    finalColor += color[0];

    // start at ymin+1 due to "top left" rasterization rule
    let y = ymin + 1;
    while (y <= ymax) {
      // TODO move tiebreaking to pixel center
      let x = this.startBuffer[y] >> FixedPointVector.SHIFT;
      let endx = (this.endBuffer[y] >> FixedPointVector.SHIFT) - 1;

      // hortizontal clip
      x = Math.max(x, 0);
      endx = Math.min(endx, this.screenSize[0] - 1);
      while (x <= endx) {
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
