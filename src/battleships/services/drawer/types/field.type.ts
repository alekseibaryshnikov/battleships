import { IField } from '../interfaces';
export class FieldType implements IField {
  x: { start: number, end: number };
  y: { start: number, end: number }
  isShooted: boolean;
  isShip: boolean;
  isArea: boolean;

  constructor() {
    this.x = { start: 0, end: 0 };
    this.y = { start: 0, end: 0 };
    this.isArea = false;
    this.isShip = false;
    this.isShooted = false;
  }
}