import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IShip, IField, ICoordinates } from './drawer';
import { IHoverShip } from './drawer';

@Injectable()
export class MemoryService {
  private _userShip = new Array<IShip>();
  private _fieldsStorage: IField[][];

  private _enemyStorage: IField[][];
  private _enemyShips: IShip[];

  public shipsChanges = new Subject<IShip[]>();
  public fieldsChanges = new Subject<IField[][]>();
  public hoveredShipChanges = new Subject<IHoverShip>();
  public enemyChanges = new Subject<IField[][]>();
  public enemyShipsChanges = new Subject<IShip[]>();

  public gameStanceChange = new Subject<boolean>();
  public gameStarted = new Subject<boolean>();
  public AIStep = new Subject<boolean>();

  constructor() { }

  /**
   * Add drawed desk fields in fields storage
   *
   */
  public addDesk(field: IField[][]) {
    this._fieldsStorage = field;
    this.fieldsChanges.next(this._fieldsStorage.slice());
  }

  /**
   * Start game
   */
  public startGame() {
    this.gameStarted.next(true);
  }

  /**
   * Changes steps
   */
  public changeStep(isAIStep: boolean) {
    this.AIStep.next(isAIStep);
  }

  /**
   * Add enemys storage with generated ships
   */
  public addEnemyDesk(fields: IField[][], ships: IShip[]) {
    this._enemyStorage = this.addEnemyShips(ships, fields);
    this.enemyChanges.next(this._enemyStorage.slice());
  }

  /**
   * Add enemy ships
   */
  public addEnemyShips(ships: IShip[], fields: IField[][]) {
    this._enemyShips = ships;
    this.enemyShipsChanges.next(this._enemyShips.slice());

    ships.forEach(ship => {
      ship.fields.forEach(shipField => {
        fields[shipField.x][shipField.y].isShip = true;
      });
    });
    return fields;
  }

  /**
   * Get field coordinate by fields storage indexes
   */
  public getFieldCoords(x: number, y: number): IField {
    if (this._fieldsStorage[x] && this._fieldsStorage[x][y]) {
      return this._fieldsStorage[x][y];
    } else {
      return undefined;
    }
  }

  /**
   * Get field from fields storage by coodrinates
   * and return field and indexes for fields storage array
   */
  public getField(x: number, y: number, enemy?: boolean): { wanted: IField; indexes: { x: number; y: number } } {
    let wanted: IField;
    const indexes = <{ x: number; y: number }>{};
    const researchStorage = enemy ? this._enemyStorage : this._fieldsStorage;
    for (let i = 0; i < researchStorage.length; i++) {
      wanted = researchStorage[i].find((fieldX, index) => {
        const result =
          x >= fieldX.x.start &&
          x <= fieldX.x.end &&
          y >= fieldX.y.start &&
          y <= fieldX.y.end;
        if (result) {
          indexes.x = i;
          indexes.y = index;
        }
        return result;
      });
      if (wanted) {
        break;
      }
    }
    return wanted ? { wanted, indexes } : undefined;
  }

  /**
   * Get able fields which can be redraw
   * Need for reset desk without deleting ships, for example
   */
  public getAvailableFields(enemyStorage?: boolean): IField[] {
    const availableFields = new Array<IField>();
    const storage = enemyStorage ? this._enemyStorage : this._fieldsStorage;

    for (let i = 0; i < storage.length; i++) {
      for (let j = 0; j < this._fieldsStorage[i].length; j++) {
        if (
          !storage[i][j].isArea &&
          !storage[i][j].isShip &&
          !storage[i][j].isShooted
        ) {
          availableFields.push(storage[i][j]);
        }
      }
    }
    return availableFields;
  }

  /**
   * Check availability for a field
   * Looking for a ship or ship area parameters
   */
  public checkFieldForAvailability(xIndex, yIndex): boolean {
    if (this._fieldsStorage[xIndex] && this._fieldsStorage[xIndex][yIndex]) {
      const field = this._fieldsStorage[xIndex][yIndex];
      if (field.isArea || field.isShip) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  /**
   * When brush is activated, this method save
   * ship coordinates in variable of the service and
   * you can get it after
   */
  public hoveredShipChanged(ship: IHoverShip) {
    this.hoveredShipChanges.next(ship);
  }

  /**
   * Add ship in storage users ships
   * Mark fields and mark surrounding fields
   */
  public addShip(ship: IShip) {
    ship.fields.forEach(field => {
      this._fieldsStorage[field.x][field.y].isShip = true;
      this._setShipArea(field.x, field.y);
    });
    this._userShip.push(ship);
    this.shipsChanges.next(this._userShip.slice());
  }

  public removeShip(coords: { x: number; y: number }): boolean {
    return false;
  }

  /**
   * Change fields when user hited
   */
  public hitShip(fieldElemnet: ICoordinates) {
    if (this._enemyStorage[fieldElemnet.x][fieldElemnet.y].isShooted) {
      return;
    }

    this._enemyStorage[fieldElemnet.x][fieldElemnet.y].isShooted = true;
    this.enemyChanges.next(this._enemyStorage.slice());

    this._enemyShips.map(ship => {
      let shipStance = false;
      ship.fields.forEach(shipField => {
        if (!this._enemyStorage[shipField.x][shipField.y].isShooted) {
          shipStance = true;
        }
      });
      ship.status = shipStance;
      return ship;
    });

    this._checkAvailableShips();
    this.enemyChanges.next(this._enemyStorage.slice());
    this.enemyShipsChanges.next(this._enemyShips.slice());
  }

  /**
   * Hit user ship
   * Commonly this method use in enemy component for AI shooting
   */
  public hitUserShip(fieldElemnet: ICoordinates) {
    if (this._fieldsStorage[fieldElemnet.x][fieldElemnet.y].isShooted) {
      return;
    }

    this._fieldsStorage[fieldElemnet.x][fieldElemnet.y].isShooted = true;
    this.fieldsChanges.next(this._fieldsStorage.slice());

    this._userShip.map(ship => {
      let shipStance = false;
      ship.fields.forEach(shipField => {
        if (!this._fieldsStorage[shipField.x][shipField.y].isShooted) {
          shipStance = true;
        }
      });
      ship.status = shipStance;
      return ship;
    });

    this._checkAvailableShips();
    this.fieldsChanges.next(this._fieldsStorage.slice());
    this.shipsChanges.next(this._userShip.slice());
  }

  /**
   * Check availabe user and enemy ships
   * If user or enemy have no ships game is ended
   */
  private _checkAvailableShips() {
    let enemyShips = false;
    let userShips = false;

    this._enemyShips.forEach(enemyShip => {
      if (enemyShip.status) {
        enemyShips = true;
        return;
      }
    });

    this._userShip.forEach(userShip => {
      if (userShip.status) {
        userShips = true;
        return;
      }
    });

    this.gameStanceChange.next(enemyShips && userShips);
  }

  /**
   * Set area around of ship
   * This need for disable fields around of ship
   */
  private _setShipArea(x: number, y: number) {
    const xPivotMiddle = x;
    const xPivotLeft = x - 1;
    const xPivotRight = x + 1;

    const yPivotMiddle = y;
    const yPivotTop = y - 1;
    const yPivotBottom = y + 1;

    const matrixSize = this._fieldsStorage.length - 1;

    // Set area for the top row from left to right
    if (xPivotLeft >= 0 && yPivotTop >= 0) {
      this._fieldsStorage[xPivotLeft][yPivotTop].isArea = true;
    }
    if (yPivotTop >= 0) {
      this._fieldsStorage[xPivotMiddle][yPivotTop].isArea = true;
    }
    if (xPivotRight <= matrixSize && yPivotTop >= 0) {
      this._fieldsStorage[xPivotRight][yPivotTop].isArea = true;
    }

    // Set area for the middle row from left to right
    if (xPivotLeft >= 0) {
      this._fieldsStorage[xPivotLeft][yPivotMiddle].isArea = true;
    }
    if (xPivotRight <= matrixSize) {
      this._fieldsStorage[xPivotRight][yPivotMiddle].isArea = true;
    }

    // Set area for the bottom row from left to right
    if (xPivotLeft >= 0 && yPivotBottom <= matrixSize) {
      this._fieldsStorage[xPivotLeft][yPivotBottom].isArea = true;
    }
    if (yPivotBottom <= matrixSize) {
      this._fieldsStorage[xPivotMiddle][yPivotBottom].isArea = true;
    }
    if (xPivotRight <= matrixSize && yPivotBottom <= matrixSize) {
      this._fieldsStorage[xPivotRight][yPivotBottom].isArea = true;
    }
  }
}
