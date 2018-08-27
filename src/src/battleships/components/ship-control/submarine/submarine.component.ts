import { Component, OnInit, Input, Output, Renderer2, ElementRef, EventEmitter } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { EditorService } from '../../../services/editor.service';
import { MemoryService } from '../../../services/memory.service';

@Component({
  selector: 'battleships-submarine',
  templateUrl: './submarine.component.html',
  styleUrls: ['./submarine.component.scss'],
  animations: [
    trigger('isActive', [
      state('active', style({
        boxShadow: 'inset 0 0 10px 2px rgba(0, 0, 0, .3)'
      })),
      state('inactive', style({
        boxShadow: 'none'
      })),
      transition('* => *', animate('100ms ease-in'))
    ])
  ]
})
export class SubmarineComponent implements OnInit {


  @Output() status = new EventEmitter<boolean>();
  @Input() color: string;

  public stanceClasses = {
    'disabled': false
  };
  public counter = 0;
  public isActive = 'inactive';

  constructor(private _renderer: Renderer2, private _elementRef: ElementRef, private _editorService: EditorService, private _memoryService: MemoryService) { }

  ngOnInit() {
    const submarine = this._elementRef.nativeElement.querySelector('div.ship > div.icon');
    if (!this.color && this.color.length === 0) {
      this.color = '#000000';
    }
    this._renderer.setStyle(submarine, 'background-color', this.color);
    this._memoryService.shipsChanges.subscribe(ships => {
      this.counter = ships.reduce((n, ship) => {
        return n + ((ship.shipType === 'submarine') ? 1 : 0);
      }, 0);

      if (this.counter >= 2) {
        this.stanceClasses.disabled = true;
        this.status.emit(false);
      } else {
        this.status.emit(true);
      }
    });
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
      this._editorService.setActiveType('submarine');
    } else {
      this._editorService.unsetActiveType('submarine');
    }
  }
}