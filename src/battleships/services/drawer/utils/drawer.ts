import { IField, ICoordinates } from '../';
import { IDrawerConfig } from '../interfaces/drawer.interface';
export class Drawer {

  private _context: CanvasRenderingContext2D;

  private _matrixSize: number;
  get matrixSize() {
    return this._matrixSize;
  }

  private _deskSize: number;
  get deskSize() {
    return this._deskSize;
  }

  private _gap: number;
  get gap() {
    return this._gap;
  }

  private _squareSize: number;
  get squareSize() {
    return this._squareSize;
  }

  constructor(context: CanvasRenderingContext2D, drawerConfig: IDrawerConfig) {
    for (let propName in drawerConfig) {
      if (drawerConfig.hasOwnProperty(propName)) {
        let thisPropName = `_${propName}`;
        this[thisPropName] = drawerConfig[propName];
      }
    }
    this._context = context;
  }

  /**
   * Draw one rectangle (currently it is square)
   * Remember that we have square model
   */
  public drawRect(x: number, y: number, color: string) {
    this._context.fillStyle = color;
    this._context.fillRect(x, y, this._squareSize, this._squareSize);
  }

  /**
   * Draw single field of ship
   * For drowning multi fields ship just use loop
   */
  public drawShip(color: string, ...coordinates: ICoordinates[]) {
    color = color || '#ccc';
    for (let i = 0; i < coordinates.length; i++) {
      this.drawRect(coordinates[i].x, coordinates[i].y, color);
    }
  }

  /**
   * Draw hist
   */
  public drawHits(color: string, coordinates: ICoordinates) {
    color = color || '#ccc';
    this.drawRect(coordinates.x, coordinates.y, color);
  }

  /**
   * Calculate size for for one square field
   */
  private _getSquareSize(): number {
    return this._deskSize / this._matrixSize - this._gap;
  }
}