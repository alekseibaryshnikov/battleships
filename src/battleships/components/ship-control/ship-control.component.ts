import { Component, OnInit, DoCheck } from '@angular/core';
import { MemoryService } from '../../services/memory.service';

@Component({
  selector: 'battleships-ship-control',
  templateUrl: './ship-control.component.html',
  styleUrls: ['./ship-control.component.scss']
})
export class ShipControlComponent implements OnInit, DoCheck {
  ships = {
    submarine: true,
    battleship: true,
    flattop: true
  };

  public stanceClasses = {
    disabled: false
  };

  constructor(private _memoryService: MemoryService) {}

  ngOnInit() {}

  ngDoCheck() {
    if (!this.stanceClasses.disabled) {
      this.stanceClasses.disabled = !(
        this.ships.battleship ||
        this.ships.flattop ||
        this.ships.submarine
      );
    } else {
      this._memoryService.startGame();
    }
  }

  checkSubmarine(event: boolean) {
    this.ships.submarine = event;
  }

  checkBattleship(event: boolean) {
    this.ships.battleship = event;
  }

  checkFlattop(event: boolean) {
    this.ships.flattop = event;
  }
}
