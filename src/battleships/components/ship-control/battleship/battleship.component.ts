import {
  Component,
  OnInit,
  Input,
  Renderer2,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';
import { EditorService } from '../../../services/editor.service';
import { MemoryService } from '../../../services/memory.service';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'battleships-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.scss'],
  animations: [
    trigger('shipState', [
      state(
        'horizontal',
        style({
          transform: 'rotate(-90deg)'
        })
      ),
      state(
        'vertical',
        style({
          transform: 'rotate(0)'
        })
      ),
      transition('* => *', animate('50ms ease-in'))
    ]),
    trigger('isActive', [
      state(
        'active',
        style({
          boxShadow: 'inset 0 0 10px 2px rgba(0, 0, 0, .3)'
        })
      ),
      state(
        'inactive',
        style({
          boxShadow: 'none'
        })
      ),
      transition('* => *', animate('100ms ease-in'))
    ])
  ]
})
export class BattleshipComponent implements OnInit {
  @Input()
  color: string;
  @Output()
  status = new EventEmitter<boolean>();

  public shipState = 'vertical';
  public isActive = 'inactive';

  public stanceClasses = {
    disabled: false
  };
  public counter = 0;

  private _states = ['vertical', 'horizontal'];

  constructor(
    private _renderer: Renderer2,
    private _elementRef: ElementRef,
    private _editorService: EditorService,
    private _memoryService: MemoryService
  ) { }

  ngOnInit() {
    const battleShip = this._elementRef.nativeElement.querySelectorAll(
      'div.ship > div.icon'
    );
    if (!this.color && this.color.length === 0) {
      this.color = '#000000';
    }

    battleShip.forEach(part => {
      this._renderer.setStyle(part, 'background-color', this.color);
    });

    this._memoryService.shipsChanges.subscribe(ships => {
      this.counter = ships.reduce((n, ship) => {
        return n + (ship.shipType === 'battleship' ? 1 : 0);
      }, 0);

      if (this.counter >= 1) {
        this.stanceClasses.disabled = true;
        this.status.emit(false);
      } else {
        this.status.emit(true);
      }
    });
  }

  rotate() {
    if (this.shipState === 'vertical') {
      this.shipState = 'horizontal';
    } else {
      this.shipState = 'vertical';
    }
  }

  activate(outclicked: boolean) {
    switch (true) {
      case !outclicked && this.isActive === 'inactive':
        this.isActive = 'active';
        break;
      case !outclicked && this.isActive === 'active':
        this.isActive = 'inactive';
        break;
      default:
        this.isActive = 'inactive';
    }

    if (this.isActive === 'active') {
      this._editorService.setActiveType('battleship', this.shipState);
    } else {
      this._editorService.unsetActiveType('battleship');
    }
  }
}
