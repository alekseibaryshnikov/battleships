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
  ) {}

  ngOnInit() {
    this._context = this._elementRef.nativeElement
      .querySelector('canvas#enemy-desk')
      .getContext('2d');
    const canvasPosition = this._elementRef.nativeElement.getBoundingClientRect();
    this._correction = { x: canvasPosition.x, y: canvasPosition.y };
    this._drawerService.initEnemyDesk(this._context, this._correction);

    // TODO: Yeah, I know that it is crutch and it should be refactored in Agnular convention :) I am sorry, I had no time :(
    setTimeout(() => {
      this._setEnemyShips();
    }, 1);

    this._memoryService.enemyShipsChanges.subscribe(ships => {
      this._enemyShips = ships;
    });
    this._memoryService.enemyChanges.subscribe(fields => {
      this._enemyFields = fields;
      this._drawerService.drawHittedEmeny(
        this._context,
        fields,
        this._correction
      );
    });

    this._memoryService.gameStarted.subscribe(started => {
      this.isGameStarted = started;
      this.stanceClasses.started = started;
    });

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
   * Hit field
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
   * TODO: Neet to make randomizer for stetting ships in random places
   */
  private _setEnemyShips() {
    // Pseudo AI
    // Set the ships
    const ships = new Array<IShip>();
    const filledFields = new Array<{ x: number; y: number }>();
    const matrixSize = this._drawerService.drawerConfig.matrixSize;

    /**
     * Make submarine
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

    const flattop = () => {
      let flag = true;
      let x: number;
      let y: number;
      let rotate: number;
      const flattopCoords = new Array<{ x: number; y: number }>();

      while (flag) {
        x = Math.round(Math.random() * Math.floor(matrixSize));
        y = Math.round(Math.random() * Math.floor(matrixSize));
        rotate = Math.round(Math.random() * Math.floor(1));

        if (rotate > 0 && (x - 1 > 0 && x + 1 <= matrixSize)) {
          flattopCoords.push({ x, y }, { x: x + 1, y }, { x: x - 1, y });
          flag = false;
        } else if (rotate === 0 && (y - 1 > 0 && y + 1 <= matrixSize)) {
          flattopCoords.push({ x, y }, { x, y: y + 1 }, { x, y: y - 1 });
          flag = false;
        }

        const checkField = filledFields.find(field => {
          return field.x === x && field.y === y;
        });

        if (!checkField) {
          flag = false;
        }
      }
    };

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
      if (x + 1 <= matrixSize && y + 1 <= matrixSize) {
        filledFields.push({ x: x + 1, y: y + 1 });
      }
      if (x + 1 <= matrixSize) {
        filledFields.push({ x: x + 1, y });
      }
      if (x + 1 <= matrixSize && y - 1 > 0) {
        filledFields.push({ x: x + 1, y: y - 1 });
      }

      // Mark as used fields for pillar: :|:
      if (y + 1 <= matrixSize) {
        filledFields.push({ x, y: y + 1 });
      }
      if (y - 1 > 0) {
        filledFields.push({ x, y: y - 1 });
      }

      // Mark as used fields for pillar: |::
      if (x - 1 > 0 && y + 1 <= matrixSize) {
        filledFields.push({ x: x - 1, y: y + 1 });
      }
      if (x - 1 > 0) {
        filledFields.push({ x: x - 1, y });
      }
      if (x - 1 > 0 && y - 1 > 0) {
        filledFields.push({ x: x - 1, y: y - 1 });
      }
    };

    ships.push(
      {
        fields: [{ x: 0, y: 0 }],
        shipType: 'submarine',
        status: true
      },
      {
        fields: [{ x: 9, y: 9 }],
        shipType: 'submarine',
        status: true
      },
      {
        fields: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
        shipType: 'battleship',
        status: true
      },
      {
        fields: [
          { x: 3, y: 9 },
          { x: 4, y: 9 },
          { x: 5, y: 9 },
          { x: 5, y: 8 }
        ],
        shipType: 'battleship',
        status: true
      }
    );
    this._memoryService.addEnemyShips(ships);
  }
}
