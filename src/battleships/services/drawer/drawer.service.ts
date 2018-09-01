import { Injectable } from '@angular/core';
import {
  IField,
  IDrawerConfig,
  IShip,
  ICoordinates,
  IHoverShip
} from './interfaces';
import { Desk, Drawer } from './utils';

// Services
import { MemoryService } from '../memory.service';

@Injectable()
export class DrawerService {
  /**
   * Desk settings
   *
   */
  private _drawerConfig = <IDrawerConfig>{
    gap: 3,
    matrixSize: 10,
    deskSize: 300,
    squareSize: 300 / 10 - 3
  };
  get drawerConfig() {
    return this._drawerConfig;
  }

  constructor(private _memoryService: MemoryService) { }

  /**
   * Initialize the desk and fill memory storage with fields
   */
  public initDesk(context: CanvasRenderingContext2D) {
    const desk = new Desk(new Drawer(context, this._drawerConfig));
    this._memoryService.addDesk(desk.draw());
  }

  /**
   * Initialize enemy desk and fill memory storage with fields
   */
  public initEnemyDesk(context: CanvasRenderingContext2D, correction: ICoordinates, ships: IShip[]) {
    const desk = new Desk(new Drawer(context, this._drawerConfig));
    this._memoryService.addEnemyDesk(desk.draw(correction), ships);
  }

  /**
   * Submarine brush
   */
  public submarineBrush(context: CanvasRenderingContext2D, field, rotation?: string) {
    if (this._memoryService.checkFieldForAvailability(field.indexes.x, field.indexes.y)) {
      const drawer = new Drawer(context, this._drawerConfig);
      const coordinates = new Array<ICoordinates>();

      coordinates.push({ x: field.wanted.x.start, y: field.wanted.y.start });

      this.redrawDesk(context);

      drawer.drawShip('#ccc', ...coordinates);

      const hoveredShip: IHoverShip = { coordinates, shipType: 'submarine' };
      this._memoryService.hoveredShipChanged(hoveredShip);
    } else {
      return false;
    }
  }

  /**
   * Battleship brush
   */
  public battleshipBrush(context: CanvasRenderingContext2D, field, rotation: string) {
    const drawer = new Drawer(context, this._drawerConfig);
    const coordinates = new Array<ICoordinates>();

    for (let i = 0; i < 3; i++) {
      const nextField = this._getNextFieldForBattleships(field, i, rotation);
      if (nextField) {
        coordinates.push({ x: nextField.x.start, y: nextField.y.start });
      } else {
        return false;
      }
    }

    this.redrawDesk(context);

    drawer.drawShip('#ccc', ...coordinates);

    const hoveredShip: IHoverShip = { coordinates, shipType: 'battleship' };
    this._memoryService.hoveredShipChanged(hoveredShip);
  }

  /**
   * Flattop brush
   */
  public flattopBrush(context: CanvasRenderingContext2D, field, rotation: string) {
    const drawer = new Drawer(context, this._drawerConfig);
    const coordinates = new Array<ICoordinates>();

    // Variations of flattop positions
    const rotations = [
      'vertical-bottom-right',
      'horizontal-top-right',
      'vertical-top-left',
      'horizontal-bottom-left'
    ];

    // Parameters for directuions
    const splitedRotation = rotation.split('-');
    const direction = splitedRotation.shift();
    const takeOffDeck = splitedRotation.join('-');

    // Just draw 3 point line like battleship
    for (let i = 0; i < 3; i++) {
      const nextField = this._getNextFieldForBattleships(field, i, direction);
      if (nextField) {
        coordinates.push({ x: nextField.x.start, y: nextField.y.start });
      } else {
        return false;
      }
    }

    /*
     * Calculate take off desk for flattop
     */
    let takeOffDeckCoordinates: ICoordinates = { x: 0, y: 0 };
    if (direction === 'horizontal') {
      switch (takeOffDeck) {
        case 'bottom-left':
          takeOffDeckCoordinates = { x: field.indexes.x, y: ++field.indexes.y };
          break;
        case 'top-right':
          takeOffDeckCoordinates = {
            x: field.indexes.x + 2,
            y: --field.indexes.y
          };
          break;
        default:
          break;
      }
    } else {
      switch (takeOffDeck) {
        case 'bottom-right':
          takeOffDeckCoordinates = {
            x: ++field.indexes.x,
            y: field.indexes.y + 2
          };
          break;
        case 'top-left':
          takeOffDeckCoordinates = { x: --field.indexes.x, y: field.indexes.y };
          break;
        default:
          break;
      }
    }

    // Get field of take of deck
    const takeOffDeckField = this._memoryService.getFieldCoords(
      takeOffDeckCoordinates.x,
      takeOffDeckCoordinates.y
    );
    if (
      takeOffDeckField &&
      !takeOffDeckField.isArea &&
      !takeOffDeckField.isShip
    ) {
      coordinates.push({
        x: takeOffDeckField.x.start,
        y: takeOffDeckField.y.start
      });
    } else {
      return false;
    }

    this.redrawDesk(context);
    drawer.drawShip('#ccc', ...coordinates);
    const hoveredShip: IHoverShip = { coordinates, shipType: 'flattop' };
    this._memoryService.hoveredShipChanged(hoveredShip);
  }

  /**
   * Redraw desk filds accroding with settled user ships
   */
  public redrawDesk(context: CanvasRenderingContext2D, isEnemy?: boolean) {
    const drawer = new Drawer(context, this._drawerConfig);
    const fields = this._memoryService.getAvailableFields(isEnemy);
    const coordinates = new Array<ICoordinates>();
    const desk = new Desk(drawer);

    fields.forEach(field => {
      coordinates.push({ x: field.x.start, y: field.y.start });
    });

    desk.drawDesk(...coordinates);
  }

  /**
   * Draw ships
   * Ships coordinates are taking from service
   */
  public drawShips(context: CanvasRenderingContext2D, userShips: IShip[]) {
    this.redrawDesk(context);
    const drawer = new Drawer(context, this.drawerConfig);
    const shipsColors = {
      submarine: '#252525',
      battleship: '#FF996A',
      flattop: '#A51733',
      hitted: '#ffff00'
    };
    userShips.forEach(ship => {
      ship.fields.forEach(shipField => {
        const field = this._memoryService.getFieldCoords(
          shipField.x,
          shipField.y
        );
        const coordinates: ICoordinates = {
          x: field.x.start,
          y: field.y.start
        };
        const coordinatesArray = new Array<ICoordinates>();
        const color = field.isShooted
          ? shipsColors.hitted
          : shipsColors[ship.shipType];
        coordinatesArray.push(coordinates);
        drawer.drawShip(color, ...coordinatesArray);
      });
    });
  }

  /**
   * Draw hits on the enemys desk
   */
  public drawHittedEmeny(
    context: CanvasRenderingContext2D,
    enemyFields: IField[][],
    correction: ICoordinates
  ) {
    this.redrawDesk(context, true);
    const drawer = new Drawer(context, this.drawerConfig);
    enemyFields.forEach(fieldY => {
      fieldY.forEach(fieldX => {
        if (fieldX.isShip && fieldX.isShooted) {
          drawer.drawHits('#CC0000', {
            x: fieldX.x.start - correction.x,
            y: fieldX.y.start - correction.y
          });
        } else if (fieldX.isShooted) {
          drawer.drawHits('#CCCCCC', {
            x: fieldX.x.start - correction.x,
            y: fieldX.y.start - correction.y
          });
        }
      });
    });
  }

  /**
   * Draw hits on the users desk
   */
  public drawHittedUsers(
    context: CanvasRenderingContext2D,
    userFields: IField[][]
  ) {
    this.redrawDesk(context);
    const drawer = new Drawer(context, this.drawerConfig);
    userFields.forEach(fieldY => {
      fieldY.forEach(fieldX => {
        if (fieldX.isShip && fieldX.isShooted) {
          drawer.drawHits('#CC0000', { x: fieldX.x.start, y: fieldX.y.start });
        } else if (fieldX.isShooted) {
          drawer.drawHits('#CCCCCC', { x: fieldX.x.start, y: fieldX.y.start });
        }
      });
    });
  }

  /**
   * Get field for the multifields ships like battleship or flattop
   */
  private _getNextFieldForBattleships(field, index: number, rotation: string): IField {
    if (rotation && rotation === 'horizontal') {
      if (
        this._memoryService.checkFieldForAvailability(
          field.indexes.x + index,
          field.indexes.y
        )
      ) {
        return this._memoryService.getFieldCoords(
          field.indexes.x + index,
          field.indexes.y
        );
      } else {
        return undefined;
      }
    } else {
      if (
        this._memoryService.checkFieldForAvailability(
          field.indexes.x,
          field.indexes.y + index
        )
      ) {
        return this._memoryService.getFieldCoords(
          field.indexes.x,
          field.indexes.y + index
        );
      } else {
        return undefined;
      }
    }
  }
}
