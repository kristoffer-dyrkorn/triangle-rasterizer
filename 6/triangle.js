import Vector from "../lib/vector.js";

export default class Triangle {
  constructor(vertexIndices, screenBuffer) {
    this.buffer = screenBuffer;

    this.va = vertexIndices[0];
    this.vb = vertexIndices[1];
    this.vc = vertexIndices[2];
  }

  getDeterminant(a, b, c) {
    const ab = new Vector(b);
    ab.sub(a);

    const ac = new Vector(c);
    ac.sub(a);

    return ab[1] * ac[0] - ab[0] * ac[1];
  }

  draw(screenCoordinates, color) {
    // get screen coordinates for this triangle
    const va = screenCoordinates[this.va];
    const vb = screenCoordinates[this.vb];
    const vc = screenCoordinates[this.vc];

    const determinant = this.getDeterminant(va, vb, vc);

    // backface culling: only draw if determinant is positive
    // in that case, the triangle is ccw oriented - ie front-facing
    if (determinant <= 0) {
      return;
    }

    // create bounding box around triangle
    const xmin = Math.floor(Math.min(va[0], vb[0], vc[0]));
    const ymin = Math.floor(Math.min(va[1], vb[1], vc[1]));

    const xmax = Math.ceil(Math.max(va[0], vb[0], vc[0]));
    const ymax = Math.ceil(Math.max(va[1], vb[1], vc[1]));

    let imageOffset = 4 * (ymin * this.buffer.width + xmin);

    // stride: change in raster buffer offsets from one line to next
    const imageStride = 4 * (this.buffer.width - (xmax - xmin) - 1);

    // w = edge distances
    const w = new Vector();

    // p = screen coordinates
    const p = new Vector();

    for (let y = ymin; y <= ymax; y++) {
      for (let x = xmin; x <= xmax; x++) {
        p[0] = x + 0.5;
        p[1] = y + 0.5;

        w[0] = this.getDeterminant(vb, vc, p);
        w[1] = this.getDeterminant(vc, va, p);
        w[2] = this.getDeterminant(va, vb, p);

        if (isLeftOrTopEdge(vb, vc)) w[0]--;
        if (isLeftOrTopEdge(vc, va)) w[1]--;
        if (isLeftOrTopEdge(va, vb)) w[2]--;

        if (w[0] >= 0 && w[1] >= 0 && w[2] >= 0) {
          this.buffer.data[imageOffset + 0] = color[0];
          this.buffer.data[imageOffset + 1] = color[1];
          this.buffer.data[imageOffset + 2] = color[2];
          this.buffer.data[imageOffset + 3] = 255;
        }
        imageOffset += 4;
      }
      imageOffset += imageStride;
    }
  }
}

function isLeftOrTopEdge(start, end) {
  const edge = new Vector(end);
  edge.sub(start);
  if (edge[1] > 0 || (edge[1] == 0 && edge[0] < 0)) return true;
  return false;
}
