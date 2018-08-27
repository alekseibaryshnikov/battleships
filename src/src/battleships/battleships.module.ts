import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DeskComponent } from './components/desk/desk.component';
import { MemoryService } from './services/memory.service';
import { DrawerService } from './services/drawer/drawer.service';
import { UserInteractionDirective } from './directives/user-interaction.directive';

// Ships panel
import { ShipControlComponent } from './components/ship-control/ship-control.component';
import { SubmarineComponent } from './components/ship-control/submarine/submarine.component';
import { BattleshipComponent } from './components/ship-control/battleship/battleship.component';
import { FlattopComponent } from './components/ship-control/flattop/flattop.component';
import { OutclickDirective } from './directives/outclick.directive';
import { EditorService } from './services/editor.service';
import { EnemyComponent } from './components/enemy/enemy.component';

@NgModule({
  imports: [
    BrowserAnimationsModule
  ],
  declarations: [
    DeskComponent,
    UserInteractionDirective,
    SubmarineComponent,
    ShipControlComponent,
    BattleshipComponent,
    FlattopComponent,
    OutclickDirective,
    EnemyComponent
  ],
  exports: [DeskComponent],
  providers: [MemoryService, EditorService, DrawerService]
})
export class BattleShipsModule { }