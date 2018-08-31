import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  Renderer2,
  Input
} from '@angular/core';
import { MemoryService } from '../../services/memory.service';
import { EditorService } from '../../services/editor.service';
import { DrawerService } from '../../services/drawer/drawer.service';

import { IShip, IField, IHoverShip } from '../../services/drawer';

import { Subscription } from 'rxjs';

@Component({
  selector: 'battleships-desk',
  templateUrl: './desk.component.html',
  styleUrls: ['./desk.component.scss']
})
export class DeskComponent implements OnInit, AfterViewInit {
  private _context: CanvasRenderingContext2D;
  private _activeBrush;
  private _hoveredShip: IHoverShip;
  private _userShips: IShip[];
  private _fieldsStorage: IField[][];

  public isActive: boolean;

  public statusClasses = {
    gameover: false
  };

  constructor(
    private _elementRef: ElementRef,
    private _drawerService: DrawerService,
    private _memoryService: MemoryService,
    private _editorService: EditorService
  ) {}

  ngOnInit() {
    // Look for changing brush
    this._editorService.activatedType.subscribe(activatedType => {
      this._activeBrush = activatedType.find(activeBrush => {
        return activeBrush.status;
      });
    });

    // Current ship on cursor which prepared for saving
    this._memoryService.hoveredShipChanges.subscribe(hoveredShip => {
      this._hoveredShip = hoveredShip;
    });

    // Draw users ships
    this._memoryService.shipsChanges.subscribe(userShips => {
      this._userShips = userShips;
      this._drawerService.drawShips(this._context, this._userShips);
    });

    this._memoryService.fieldsChanges.subscribe(fields => {
      this._fieldsStorage = fields;
      this._drawerService.drawHittedUsers(this._context, fields);
    });

    this._memoryService.gameStanceChange.subscribe(stance => {
      this.statusClasses.gameover = !stance;
    });
  }

  ngAfterViewInit() {
    this._context = this._elementRef.nativeElement
      .querySelector('canvas#desk')
      .getContext('2d');
    this._drawerService.initDesk(this._context);
  }

  /**
   * Draw hovers for ships when some of ship brushes is activated
   * Ships are choosing by autoload from activated brush name
   *
   */
  emitEditor(targetCoords: { x: number; y: number }) {
    if (this._activeBrush) {
      const field = this._memoryService.getField(
        targetCoords.x - this._drawerService.drawerConfig.squareSize,
        targetCoords.y - this._drawerService.drawerConfig.squareSize
      );

      if (field) {
        this._drawerService[`${this._activeBrush.name}Brush`](
          this._context,
          field,
          this._activeBrush.rotation
        );
      }
    }
  }

  /**
   * Reset editor when outclicked from desk
   */
  resetEditor(event) {
    if (event) {
      this._drawerService.redrawDesk(this._context);
    }
  }

  /**
   * Add ship in memory
   */
  addShip() {
    if (this._hoveredShip) {
      const newShip = <IShip>{
        fields: [],
        shipType: this._hoveredShip.shipType
      };
      const newShipFields = [];
      this._hoveredShip.coordinates.forEach(coordinate => {
        const field = this._memoryService.getField(coordinate.x, coordinate.y);
        if (field) {
          newShipFields.push({ x: field.indexes.x, y: field.indexes.y });
        }
      });
      newShip.fields = newShipFields;
      this._memoryService.addShip(newShip);
      this._memoryService.hoveredShipChanges.next(undefined);
    }
  }
}
