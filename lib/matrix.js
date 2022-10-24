import Vector from "./vector.js";

const DEGREES_TO_RADIANS = Math.PI / 180;

// offsets into the array where various
// vectors are found
const X_AXIS = 0;
const Y_AXIS = 4;
const Z_AXIS = 8;
const POSITION = 12;

export default class Matrix extends Float32Array {
  constructor(m) {
    super(16);
    // copy constructor
    if (m instanceof Matrix) {
      this.set(m);
    } else {
      // create identity matrix
      this[0] = 1.0;
      this[5] = 1.0;
      this[10] = 1.0;
      this[15] = 1.0;
    }
  }

  getXAxis() {
    return new Vector(this, X_AXIS);
  }

  getYAxis() {
    return new Vector(this, Y_AXIS);
  }

  getZAxis() {
    return new Vector(this, Z_AXIS);
  }

  getPosition() {
    return new Vector(this, POSITION);
  }

  getDirection() {
    return this.getZAxis().scale(-1);
  }

  moveForward(dist) {
    const p = this.position();
    p.add(this.getZAxis().scale(-dist));
    this.setValue(p, POSITION);
  }

  rotateX(angle) {
    this.rotate(angle, 0, 0);
  }

  rotateY(angle) {
    this.rotate(0, angle, 0);
  }

  rotateZ(angle) {
    this.rotate(0, 0, angle);
  }

  rotate(rx, ry, rz) {
    const x = this.getXAxis();
    const y = this.getYAxis();
    const z = this.getZAxis();

    if (rz !== 0.0) {
      x.rotate(y, z, rz);
    }

    if (ry !== 0.0) {
      z.rotate(x, y, ry);
    }

    if (rx !== 0.0) {
      y.rotate(z, x, rx);
    }

    this.setValue(x, X_AXIS);
    this.setValue(y, Y_AXIS);
    this.setValue(z, Z_AXIS);
  }

  setXAxis(v) {
    this.setValue(v, X_AXIS);
  }

  setYAxis(v) {
    this.setValue(v, Y_AXIS);
  }

  setZAxis(v) {
    this.setValue(v, Z_AXIS);
  }

  setPosition(v) {
    this.setValue(v, POSITION);
  }

  setValue(v, offset) {
    this[offset + 0] = v[0];
    this[offset + 1] = v[1];
    this[offset + 2] = v[2];
  }

  multiply(m1, m2) {
    this[0] = m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8] + m1[3] * m2[12];
    this[1] = m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9] + m1[3] * m2[13];
    this[2] = m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10] + m1[3] * m2[14];
    this[3] = m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3] * m2[15];
    this[4] = m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8] + m1[7] * m2[12];
    this[5] = m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9] + m1[7] * m2[13];
    this[6] = m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10] + m1[7] * m2[14];
    this[7] = m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7] * m2[15];
    this[8] = m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8] + m1[11] * m2[12];
    this[9] = m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9] + m1[11] * m2[13];
    this[10] = m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10] + m1[11] * m2[14];
    this[11] = m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11] * m2[15];
    this[12] = m1[12] * m2[0] + m1[13] * m2[4] + m1[14] * m2[8] + m1[15] * m2[12];
    this[13] = m1[12] * m2[1] + m1[13] * m2[5] + m1[14] * m2[9] + m1[15] * m2[13];
    this[14] = m1[12] * m2[2] + m1[13] * m2[6] + m1[14] * m2[10] + m1[15] * m2[14];
    this[15] = m1[12] * m2[3] + m1[13] * m2[7] + m1[14] * m2[11] + m1[15] * m2[15];
  }

  transform(source, target) {
    target[0] = this[0] * source[0] + this[4] * source[1] + this[8] * source[2] + this[12] * source[3];
    target[1] = this[1] * source[0] + this[5] * source[1] + this[9] * source[2] + this[13] * source[3];
    target[2] = this[2] * source[0] + this[6] * source[1] + this[10] * source[2] + this[14] * source[3];
    target[3] = this[3] * source[0] + this[7] * source[1] + this[11] * source[2] + this[15] * source[3];
  }

  transposeRotation() {
    this.swap(1, 4);
    this.swap(2, 8);
    this.swap(6, 9);
  }

  // swap given elements of this matrix
  swap(a, b) {
    const tmp = this[a];
    this[a] = this[b];
    this[b] = tmp;
  }
}
