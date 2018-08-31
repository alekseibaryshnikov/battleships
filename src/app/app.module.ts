import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BattleShipsModule } from '../battleships';

import { AppComponent } from './app.component';

@NgModule({
  imports:      [ BrowserModule, BattleShipsModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
