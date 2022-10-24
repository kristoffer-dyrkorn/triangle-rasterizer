import Vector from "./vector.js";

export default class FixedPointVector extends Int32Array {
  constructor(x, y, z) {
    // homogeneous coordinates: x, y, z, w
    super(4);

    this[3] = FixedPointVector.ONE;

    if (arguments.length === 3) {
      this[0] = Math.round(x * FixedPointVector.MULTIPLIER);
      this[1] = Math.round(y * FixedPointVector.MULTIPLIER);
      this[2] = Math.round(z * FixedPointVector.MULTIPLIER);
    }
    // copy constructor
    if (x instanceof FixedPointVector) {
      this[0] = x[0];
      this[1] = x[1];
      this[2] = x[2];
      this[3] = x[3];
    }
    // convert from Vector
    if (x instanceof Vector) {
      this[0] = Math.round(x[0] * FixedPointVector.MULTIPLIER);
      this[1] = Math.round(x[1] * FixedPointVector.MULTIPLIER);
      this[2] = Math.round(x[2] * FixedPointVector.MULTIPLIER);
      this[3] = Math.round(x[3] * FixedPointVector.MULTIPLIER);
    }
  }

  add(v) {
    this[0] += v[0];
    this[1] += v[1];
    this[2] += v[2];
  }

  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    this[2] -= v[2];
  }

  scale(s) {
    this[0] *= s;
    this[1] *= s;
    this[2] *= s;
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    this[2] = v[2];
    this[3] = v[3];
  }
}

FixedPointVector.SHIFT = 4;
FixedPointVector.MULTIPLIER = 2 ** FixedPointVector.SHIFT;
FixedPointVector.DIVISION_CEILING = FixedPointVector.MULTIPLIER * FixedPointVector.MULTIPLIER;
