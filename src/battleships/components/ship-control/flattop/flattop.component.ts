import {
  Component,
  OnInit,
  Input,
  Renderer2,
  ElementRef,
  EventEmitter,
  Output
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
  selector: 'battleships-flattop',
  templateUrl: './flattop.component.html',
  styleUrls: ['./flattop.component.scss'],
  animations: [
    trigger('shipState', [
      state(
        'vertical-bottom-right',
        style({
          transform: 'rotate(0) scale(1)'
        })
      ),
      state(
        'horizontal-top-right',
        style({
          transform: 'rotate(-90deg) scale(1)'
        })
      ),
      state(
        'vertical-top-left',
        style({
          transform: 'rotate(-180deg) scale(1)'
        })
      ),
      state(
        'horizontal-bottom-left',
        style({
          transform: 'rotate(-270deg) scale(1)'
        })
      ),
      transition('* => *', animate('100ms ease-in'))
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
export class FlattopComponent implements OnInit {
  @Input()
  color: string;
  @Output()
  status = new EventEmitter<boolean>();

  shipState = 'vertical-bottom-left';
  currentState = 0;
  isActive = 'inactive';

  private _stateVariations = [
    'vertical-bottom-right',
    'horizontal-top-right',
    'vertical-top-left',
    'horizontal-bottom-left'
  ];

  public position = 0;
  public counter = 0;
  public stanceClasses = {
    disabled: false
  };

  constructor(
    private _renderer: Renderer2,
    private _elementRef: ElementRef,
    private _editorService: EditorService,
    private _memoryService: MemoryService
  ) {}

  ngOnInit() {
    const flattop = this._elementRef.nativeElement.querySelectorAll(
      'div.ship > div.icon'
    );
    if (!this.color && this.color.length === 0) {
      this.color = '#000000';
    }
    flattop.forEach(part => {
      this._renderer.setStyle(part, 'background-color', this.color);
    });
    this._memoryService.shipsChanges.subscribe(ships => {
      this.counter = ships.reduce((n, ship) => {
        return n + (ship.shipType === 'flattop' ? 1 : 0);
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
    if (this.currentState < this._stateVariations.length - 1) {
      this.currentState++;
    } else {
      this.currentState = 0;
    }
    this.shipState = this._stateVariations[this.currentState];
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
      this._editorService.setActiveType(
        'flattop',
        this._stateVariations[this.currentState]
      );
    } else {
      this._editorService.unsetActiveType('flattop');
    }
  }
}
