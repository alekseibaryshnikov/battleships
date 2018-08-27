import { Component, OnInit, ElementRef } from '@angular/core';
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
  private _isLoaded: boolean = false;
  public isGameStarted: boolean = false;
  public stanceClasses = {
    'started': false
  }
  private _correction: ICoordinates;

  constructor(private _drawerService: DrawerService, private _elementRef: ElementRef, private _memoryService: MemoryService) { }

  ngOnInit() {
    this._context = this._elementRef.nativeElement.querySelector('canvas#enemy-desk').getContext('2d');
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
      this._drawerService.drawHittedEmeny(this._context, fields, this._correction);
    });

    this._memoryService.gameStarted.subscribe(started => {
      this.isGameStarted = started;
      this.stanceClasses.started = started;
    });

    this._memoryService.AIStep.subscribe(isAI => {
      if (isAI) {
        let chooseField: boolean = true;
        let fieldForHit: IField;
        while (chooseField) {
          const randomX = Math.floor(Math.random() * Math.floor(this._drawerService.drawerConfig.matrixSize - 1));
          const randomY = Math.floor(Math.random() * Math.floor(this._drawerService.drawerConfig.matrixSize - 1));
          fieldForHit = this._memoryService.getFieldCoords(randomX, randomY);
          if (fieldForHit && !fieldForHit.isShooted) {
            chooseField = false;
          }
        }
        
        const userField = this._memoryService.getField(fieldForHit.x.start, fieldForHit.y.start);
        this._memoryService.hitUserShip({x: userField.indexes.x, y: userField.indexes.y});

        this._memoryService.changeStep(false);
      }
    });
  }

  /**
   * Hit field
   */
  public hit(event) {
    this._memoryService.changeStep(true);
    const field = this._memoryService.getField(event.x, event.y, true);
    if (field) {
      this._memoryService.hitShip({ x: field.indexes.x, y: field.indexes.y });
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
        fields: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ],
        shipType: 'battleship',
        status: true
      },
      {
        fields: [
          { x: 3, y: 9 },
          { x: 4, y: 9 },
          { x: 5, y: 9 },
          { x: 5, y: 8 },
        ],
        shipType: 'battleship',
        status: true
      },
    );
    this._memoryService.addEnemyShips(ships);
  }
}