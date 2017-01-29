export class userPiece {
    constructor
      (
        public pieceId: number,
        public pieceTitle: string,
        public pieceWorkNumber: string,
        public date: string,
        public movementItem: Array<any>,
        public movementItemAmount: number 
      )
    {}   
}