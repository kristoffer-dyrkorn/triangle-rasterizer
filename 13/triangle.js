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

    let pixel_step = FixedPointVector.ONE;

    // insert the end edge value into the buffer, this makes the loops simpler
    buffer[end[1] >> FixedPointVector.SHIFT] = end[0];

    const start_x_fractional = start[0] & 15;
    const start_y_fractional = start[1] & 15;

    const start_x_integer = start[0] & ~15;
    const end_x_integer = end[0] & ~15;

    const dx_dy = dx / dy;

    // use absolute values to simplify loops
    if (dx < 0) {
      pixel_step = -pixel_step;
      dx = -dx;
    }

    if (dy > dx) {
      // y is longest axis, loop for each y

      // get fractional x coordinate where the edge intersects
      // the line y = trunc(starty) + 0.5
      const x_intersect =
        start_x_fractional -
        Math.round((start_y_fractional - FixedPointVector.HALF) * dx_dy);

      // convert the fractional x into an initial error term,
      // ie a horizontal offset relative to the ideal starting point (pixel center)
      const x_offset = x_intersect - FixedPointVector.HALF;

      // convert the inital error term into a numerator value,
      // by multiplying by dy
      let numerator = (dy * x_offset) >> FixedPointVector.SHIFT;

      // if the edge goes down and to the left, reverse the offset direction
      // since a location to the left of zero would then be a positive offset
      if (pixel_step < 0) numerator = -numerator;

      // set up loop vars
      // y and endy are integer pixel coordinates (conceptually at integer y + 0.5)
      // x is the coordinate (in fixed point) at (conceptually) integer y + 0.5)
      // the initial numerator value compensates for the fact that the y coordinate for
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

      // get fractional y coordinate where the edge intersects
      // the line x = trunc(startx) + 0.5
      const y_intersect =
        start_y_fractional -
        Math.round((start_x_fractional - FixedPointVector.HALF) / dx_dy);

      // convert fractional y into an initial error term, ie a vertical
      // distance to the ideal line - which starts at pixel center
      const y_offset = y_intersect - FixedPointVector.HALF;

      // convert inital error term into an intial numerator value
      // by multiplying by dx
      let numerator = (dx * y_offset) >> FixedPointVector.SHIFT;

      // set up loop vars
      // x and endx are fixed point pixel coordinates at integer x + 0.5
      // y is integer coordinate (conceptually sampled at integer y + 0.5)
      let x = start_x_integer + FixedPointVector.HALF;
      let y = start[1] >> FixedPointVector.SHIFT;
      let end_x = end_x_integer + FixedPointVector.HALF;

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
      // start at xmin+1 due to "top left" rasterization rule
      let x = (this.startBuffer[y] >> FixedPointVector.SHIFT) + 1;
      let endx = this.endBuffer[y] >> FixedPointVector.SHIFT;

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
