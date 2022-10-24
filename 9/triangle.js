import FixedPointVector from "../lib/fixedpointvector.js";

export default class Triangle {
  constructor(vertexIndices, screenBuffer) {
    this.buffer = screenBuffer;

    this.va = vertexIndices[0];
    this.vb = vertexIndices[1];
    this.vc = vertexIndices[2];
  }

  getDeterminant(a, b, c) {
    const ab = new FixedPointVector(b);
    ab.sub(a);

    const ac = new FixedPointVector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
  }

  draw(screenCoordinates, color) {
    // get screen coordinates for this triangle
    const va = new FixedPointVector(screenCoordinates[this.va]);
    const vb = new FixedPointVector(screenCoordinates[this.vb]);
    const vc = new FixedPointVector(screenCoordinates[this.vc]);

    const determinant = this.getDeterminant(va, vb, vc);

    // backface culling: only draw if determinant is positive
    // in that case, the triangle is ccw oriented - ie front-facing
    if (determinant <= 0) {
      return;
    }

    // create bounding box around triangle, expanding to integer coordinates
    const xmin = Math.min(va[0], vb[0], vc[0]) >> FixedPointVector.SHIFT;
    const ymin = Math.min(va[1], vb[1], vc[1]) >> FixedPointVector.SHIFT;

    const xmax = (Math.max(va[0], vb[0], vc[0]) + FixedPointVector.DIVISION_CEILING) >> FixedPointVector.SHIFT;
    const ymax = (Math.max(va[1], vb[1], vc[1]) + FixedPointVector.DIVISION_CEILING) >> FixedPointVector.SHIFT;

    // screen coordinates at the starting point (top left corner of bounding box, at pixel center)
    const topLeft = new FixedPointVector(xmin + 0.5, ymin + 0.5, 0);

    // calculate edge distances at starting point
    const wLeft = new FixedPointVector();
    wLeft[0] = this.getDeterminant(vb, vc, topLeft);
    wLeft[1] = this.getDeterminant(vc, va, topLeft);
    wLeft[2] = this.getDeterminant(va, vb, topLeft);

    if (isLeftOrTopEdge(vb, vc)) wLeft[0]--;
    if (isLeftOrTopEdge(vc, va)) wLeft[1]--;
    if (isLeftOrTopEdge(va, vb)) wLeft[2]--;

    // find per pixel / per line deltas so we can calculate w incrementally
    // note: we need to scale up deltas by the subpixel resolution since we
    // only evaluate w once for each pixel/line
    const dwdx = new FixedPointVector();
    dwdx[0] = (vb[1] - vc[1]) << FixedPointVector.SHIFT;
    dwdx[1] = (vc[1] - va[1]) << FixedPointVector.SHIFT;
    dwdx[2] = (va[1] - vb[1]) << FixedPointVector.SHIFT;

    const dwdy = new FixedPointVector();
    dwdy[0] = (vb[0] - vc[0]) << FixedPointVector.SHIFT;
    dwdy[1] = (vc[0] - va[0]) << FixedPointVector.SHIFT;
    dwdy[2] = (va[0] - vb[0]) << FixedPointVector.SHIFT;

    // index of first pixel in screen buffer
    let imageOffset = 4 * (ymin * this.buffer.width + xmin);

    // stride: change in raster buffer offsets from one line to next
    const imageStride = 4 * (this.buffer.width - (xmax - xmin) - 1);

    // hold final w values here
    const w = new FixedPointVector();

    for (let y = ymin; y <= ymax; y++) {
      w.copy(wLeft);

      for (let x = xmin; x <= xmax; x++) {
        if ((w[0] | w[1] | w[2]) >= 0) {
          this.buffer.data[imageOffset + 0] = color[0];
          this.buffer.data[imageOffset + 1] = color[1];
          this.buffer.data[imageOffset + 2] = color[2];
          this.buffer.data[imageOffset + 3] = 255;
        }
        imageOffset += 4;
        w.sub(dwdx);
      }
      imageOffset += imageStride;
      wLeft.add(dwdy);
    }
  }
}

function isLeftOrTopEdge(start, end) {
  const edge = new FixedPointVector(end);
  edge.sub(start);
  if (edge[1] > 0 || (edge[1] == 0 && edge[0] < 0)) return true;
  return false;
}
