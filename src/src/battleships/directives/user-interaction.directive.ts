import { Directive, HostListener, EventEmitter, Output, Input, Renderer2 } from '@angular/core';


@Directive({
  selector: '[UserInteractionDirective]'
})
export class UserInteractionDirective {

  @Output() targetCoords = new EventEmitter<{x: number, y: number}>();
  @Output() clickCoords = new EventEmitter<{x: number, y: number}>();

  constructor(private _render: Renderer2) { }

  @HostListener('click', ['$event'])
  onMouseClick($event) {
    const clickCoords = {
      x: $event.clientX,
      y: $event.clientY
    };
    this.clickCoords.emit(clickCoords);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove($event) {
    this._render.setStyle($event.target, 'cursor', 'crosshair');

    const targetCoords = {
      x: $event.clientX,
      y: $event.clientY
    };

    this.targetCoords.emit(targetCoords);
  }
}