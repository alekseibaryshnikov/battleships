export interface IField {
  x: {
    start: number,
    end: number
  };
  y: {
    start: number,
    end: number
  }
  isShooted: boolean;
  isShip: boolean;
  isArea: boolean; 
}