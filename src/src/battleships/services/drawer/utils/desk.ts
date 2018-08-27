import { Drawer } from '../utils/drawer';
import { IField, IFigure, ICoordinates } from '../';
import { FieldType, CoordinatesType } from '../types';

export class Desk implements IFigure {

  private _drawer: Drawer;

  constructor(drawer: Drawer) {
    this._drawer = drawer;
  }

  public drawDesk(...coordinates: ICoordinates[]) {
    for (let i = 0; i < coordinates.length; i++) {
      this._drawer.drawRect(coordinates[i].x, coordinates[i].y, '#fff');
    }
  }

  /**
   * Main method which draw net in canvas
   * Also save coordinates for fields in storage
   */
  draw(correction?: ICoordinates): IField[][] {
    let filledFields: IField[][] = this._makeMatrix();

    // The first cycle is making Y axis
    for (
      let yPosition = 0, yIndex = 0;
      yPosition < this._drawer.deskSize;
      yPosition += this._drawer.deskSize / 10, yIndex++
    ) {
      if (yIndex === 0) { yPosition = this._drawer.gap; }

      // The nested cycle is making X axis
      let xPosition = 0;
      for (let xIndex = 0; xIndex < 10; xIndex++) {

        if (xIndex === 0) { xPosition = this._drawer.gap; }
        else { xPosition = this._calcPosition(xIndex); }

        // Drawing the net itself
        this._drawer.drawRect(xPosition, yPosition, 'white');

        // Save cordinates for the field
        if(correction) {
          filledFields[xIndex][yIndex] = this._setFieldStorageCoordinates(xPosition + correction.x, yPosition + correction.y);
        } else {
          filledFields[xIndex][yIndex] = this._setFieldStorageCoordinates(xPosition, yPosition);
        }
        
      }
    }

    return filledFields;
  }

  /**
   * Calculate the X position
   * The X axis is doing incorrect when you try to render
   * just sum square size and gap.
   * 
   */
  private _calcPosition(iterator: number): number {
    let defaultPosition = this._drawer.squareSize + this._drawer.gap * 2;
    return iterator * defaultPosition - this._drawer.gap * (iterator - 1);
  }

  /**
   * Generate matrix for fields storage with coordinates
   */
  private _makeMatrix(): IField[][] {
    let matrix = [];
    for (let i = 0; i < 10; i++) {
      matrix[i] = new Array<IField>(10);
    }
    return matrix;
  }

  /**
   * Set coordinate for made square 
   * Need when we are filling the desk with fields
   */
  private _setFieldStorageCoordinates(xPosition: number, yPosition: number): IField {
    let generateField = new FieldType();
    generateField.x.start = xPosition;
    generateField.x.end = xPosition + this._drawer.squareSize;
    generateField.y.start = yPosition;
    generateField.y.end = yPosition + this._drawer.squareSize;
    return generateField;
  }
}