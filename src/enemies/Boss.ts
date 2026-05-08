import { Enemy } from './Enemy';

export class Boss extends Enemy {
    constructor(id: string, health: number) {
        super(id, health);
    }
}
