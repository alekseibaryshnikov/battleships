import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { MemoryService } from '../../services/memory.service';
import { DrawerService } from '../../services/drawer/drawer.service';
import { ICoordinates, IShip, IField } from '../../services/drawer';

@Component({
  selector: 'battleships-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss']
})
export class EnemyComponent implements OnInit {
  private _context: CanvasRenderingContext2D;
  private _enemyShips: IShip[];
  private _enemyFields: IField[][];
  private _isLoaded = false;
  public isGameStarted = false;
  public stanceClasses = {
    started: false
  };
  private _correction: ICoordinates;

  constructor(
    private _drawerService: DrawerService,
    private _elementRef: ElementRef,
    private _memoryService: MemoryService,
    private _render: Renderer2
  ) { }

  ngOnInit() {
    /**
     * Pepare canvas with settings
     */
    this._context = this._elementRef.nativeElement.querySelector('canvas#enemy-desk').getContext('2d');
    const canvasPosition = this._elementRef.nativeElement.getBoundingClientRect();
    this._correction = { x: canvasPosition.x, y: canvasPosition.y };

    /**
     * Initialise enemy desk and fill these fields array with
     * random ships
     */
    this._drawerService.initEnemyDesk(this._context, this._correction, this._setEnemyShips(2, 1, 1));

    /**
     * Subscrive on to enemy fields which is loading above
     * when desk was initialized
     */
    this._memoryService.enemyChanges.subscribe(fields => {
      this._enemyFields = fields;
      this._drawerService.drawHittedEmeny(this._context, fields, this._correction);
    });

    /**
     * Subscribe on to enemy ships changes
     */
    this._memoryService.enemyShipsChanges.subscribe(ships => {
      this._enemyShips = ships;
    });

    /**
     * Subscribe on to game status
     * If no enemy ships or user ships on the desk game are stoping
     */
    this._memoryService.gameStarted.subscribe(started => {
      this.isGameStarted = started;
      this.stanceClasses.started = started;
    });

    /**
     * Pseudo AI player
     * It is subscrining on to steps changes
     */
    this._memoryService.AIStep.subscribe(isAI => {
      if (isAI) {
        let chooseField = true;
        let fieldForHit: IField;

        // Set counter for prevent infinity loop (max nubmer is desk square)
        let counter = 0;
        while (chooseField) {
          if (
            counter >
            this._drawerService.drawerConfig.matrixSize *
            this._drawerService.drawerConfig.matrixSize
          ) {
            chooseField = true;
            this._memoryService.gameStanceChange.next(false);
          }

          // Get random field coords on the user desk
          const randomX = Math.floor(
            Math.random() *
            Math.floor(this._drawerService.drawerConfig.matrixSize)
          );
          const randomY = Math.floor(
            Math.random() *
            Math.floor(this._drawerService.drawerConfig.matrixSize)
          );

          // Check field for availability
          fieldForHit = this._memoryService.getFieldCoords(randomX, randomY);
          if (fieldForHit && !fieldForHit.isShooted) {
            chooseField = false;
          }

          counter++;
        }

        const userField = this._memoryService.getField(
          fieldForHit.x.start,
          fieldForHit.y.start
        );

        this._memoryService.hitUserShip({
          x: userField.indexes.x,
          y: userField.indexes.y
        });

        this._memoryService.changeStep(false);
      }
    });
  }

  /**
   * Hit field by user
   */
  public hit(event) {
    const field = this._memoryService.getField(event.x, event.y, true);
    if (field && !field.wanted.isShooted) {
      this._memoryService.hitShip({ x: field.indexes.x, y: field.indexes.y });
      this._memoryService.changeStep(true);
    }
  }

  /**
   * Check availability for field
   * If it is shooted - prevent events and show not-allowed cursor
   * @param event
   */
  public checkAvailability(event) {
    const field = this._memoryService.getField(event.x, event.y, true);
    if (field && field.wanted.isShooted) {
      const canvasElement = this._elementRef.nativeElement.querySelector(
        'canvas'
      );
      this._render.setStyle(canvasElement, 'cursor', 'not-allowed');
    }
  }

  /**
   * Preload enemy ships
   */
  private _setEnemyShips(submarineCount: number, flattopCount: number, battleshipCount: number): Array<IShip> {
    // Pseudo AI
    // Set the ships
    const ships = new Array<IShip>();
    const matrixSize = this._drawerService.drawerConfig.matrixSize;
    let filledFields = new Array<{ x: number; y: number }>();

    /**
     * Make submarine
     * @returns { x: number, y: number } coordinates
     */
    const submarine = (): { x: number; y: number } => {
      let flag = true;
      let x: number;
      let y: number;

      while (flag) {
        x = Math.round(Math.random() * Math.floor(matrixSize));
        y = Math.round(Math.random() * Math.floor(matrixSize));
        const checkField = filledFields.find(field => {
          return field.x === x && field.y === y;
        });

        if (!checkField) {
          flag = false;
        }
      }

      markFieldsAsFilled(x, y);

      return { x, y };
    };

    /**
     * Make battleship
     * @returns Array<{x: number, y: number}> coordinates array
     */
    const battleship = (): { coordinates: Array<{ x: number, y: number }>, rotation: number } => {
      let flag = true;
      let x: number;
      let y: number;
      let rotate: number;
      const flattopCoords = new Array<{ x: number; y: number }>();

      while (flag) {
        x = Math.round(Math.random() * Math.floor(matrixSize));
        y = Math.round(Math.random() * Math.floor(matrixSize));

        const checkField = filledFields.find(field => {
          return field.x === x && field.y === y;
        });

        if (checkField) {
          continue;
        }

        rotate = Math.round(Math.random());

        if (rotate > 0 && (x - 1 >= 0 && x + 1 < matrixSize)) {
          if (checkFields(x, y)) {
            continue;
          } else if (checkFields(x + 1, y)) {
            continue;
          } else if (checkFields(x - 1, y)) {
            continue;
          }

          flattopCoords.push({ x, y }, { x: x + 1, y }, { x: x - 1, y });
          flag = false;
        } else if (rotate === 0 && (y - 1 >= 0 && y + 1 < matrixSize)) {
          if (checkFields(x, y)) {
            continue;
          } else if (checkFields(x, y + 1)) {
            continue;
          } else if (checkFields(x, y - 1)) {
            continue;
          }

          flattopCoords.push({ x, y }, { x, y: y + 1 }, { x, y: y - 1 });
          flag = false;
        }
      }

      flattopCoords.forEach(coordinate => {
        markFieldsAsFilled(coordinate.x, coordinate.y);
      });
      return { coordinates: flattopCoords, rotation: rotate };
    };

    /**
     * Make flattop ship from battleship
     * Rotation: 0 - vertical, 1 - horizontal
     * @returns { coordinates: Array<{ x: number, y: number }>, rotation: number }
     */
    const flattop = (): { coordinates: Array<{ x: number, y: number }>, rotation: number } => {
      let flag = true;
      let takeOffDeckCoordinate: { x: number, y: number };
      let flattop: { coordinates: Array<{ x: number, y: number }>, rotation: number };

      while (flag) {
        const battleshipPart = battleship();
        if (battleshipPart.rotation === 0) {
          const takeOffDeckPosition = Math.round(Math.random() * Math.floor(1));

          if (takeOffDeckPosition === 1) {
            if (battleshipPart.coordinates[0].x - 1 < 0 || battleshipPart.coordinates[0].y - 1 < 0) {
              continue;
            }

            takeOffDeckCoordinate = { x: battleshipPart.coordinates[0].x - 1, y: battleshipPart.coordinates[0].y - 1 };
          } else {
            if (battleshipPart.coordinates[0].x + 1 > matrixSize || battleshipPart.coordinates[0].y + 1 > matrixSize) {
              continue;
            }

            takeOffDeckCoordinate = { x: battleshipPart.coordinates[0].x + 1, y: battleshipPart.coordinates[0].y + 1 };
          }

          battleshipPart.coordinates.concat(takeOffDeckCoordinate).forEach(coordinate => {
            markFieldsAsFilled(coordinate.x, coordinate.y);
          });

          flattop = { coordinates: battleshipPart.coordinates.concat(takeOffDeckCoordinate), rotation: battleshipPart.rotation };

          flag = false;
        }
      }

      return flattop;
    };

    /**
     * Check around fields of current field in existing fields array
     * @param x axis coordinate of field
     * @param y axis coordinate of field
     * @param storage Array<{x: number, y: number}>
     */
    const checkFields = (x: number, y: number) => {
      let finding = filledFields.find(field => {
        return field.x === x && field.y === y;
      });

      return finding ? true : false;
    }

    /**
     * Return array with area fields for a point
     *
     * @param x axis point
     * @param y axis point
     * @param matrixSize size of matrix in X and Y axises
     */
    const markFieldsAsFilled = (x: number, y: number) => {
      // Add field itself
      filledFields.push({ x, y });

      // Mark as used fields for pillar: ::|
      if (x + 1 < matrixSize && y + 1 < matrixSize) {
        filledFields.push({ x: x + 1, y: y + 1 });
      }
      if (x + 1 < matrixSize) {
        filledFields.push({ x: x + 1, y });
      }
      if (x + 1 < matrixSize && y - 1 >= 0) {
        filledFields.push({ x: x + 1, y: y - 1 });
      }

      // Mark as used fields for pillar: :|:
      if (y + 1 < matrixSize) {
        filledFields.push({ x, y: y + 1 });
      }
      if (y - 1 >= 0) {
        filledFields.push({ x, y: y - 1 });
      }

      // Mark as used fields for pillar: |::
      if (x - 1 >= 0 && y + 1 < matrixSize) {
        filledFields.push({ x: x - 1, y: y + 1 });
      }
      if (x - 1 >= 0) {
        filledFields.push({ x: x - 1, y });
      }
      if (x - 1 >= 0 && y - 1 >= 0) {
        filledFields.push({ x: x - 1, y: y - 1 });
      }
    };

    // Generate sumbraines
    for (let i = 1; i <= submarineCount; i++) {
      ships.push({
        fields: [submarine()],
        shipType: 'submarine',
        status: true
      });
    }

    // Generate battleships
    for (let i = 1; i <= battleshipCount; i++) {
      ships.push({
        fields: battleship().coordinates,
        shipType: 'battleship',
        status: true
      });
    }

    // Generate flattops
    for (let i = 1; i <= flattopCount; i++) {
      ships.push({
        fields: flattop().coordinates,
        shipType: 'flattop',
        status: true
      });
    }

    return ships;
  }
}
