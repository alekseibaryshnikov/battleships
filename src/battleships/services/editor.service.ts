import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class EditorService {

  private _brushTypes = [
    {
      name: 'submarine',
      status: false,
      rotation: ''
    },
    {
      name: 'battleship',
      status: false,
      rotation: ''
    },
    {
      name: 'flattop',
      status: false,
      rotation: ''
    }
  ];

  public activatedType = new Subject<{ name: string, status: boolean }[]>();

  constructor() { }

  /**
   * Set active brush and disable other
   */
  setActiveType(inputType: string, rotation?: string) {
    this._brushTypes.map(brushType => {
      if (brushType.name === inputType) {
        brushType.status = true;
        brushType.rotation = rotation;
      } else {
        brushType.status = false;
        brushType.rotation = '';
      }
    });
    this.activatedType.next(this._brushTypes.slice());
  }

  /**
   * Set inactive brush
   */
  unsetActiveType(inputType: string) {
    this._brushTypes.map(brushType => {
      if (brushType.name === inputType) {
        brushType.status = false;
      }
    });
    this.activatedType.next(this._brushTypes.slice());
  }

}