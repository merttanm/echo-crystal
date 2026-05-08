export class HealthBar {
    public currentValue: number = 0;

    update(value: number) {
        this.currentValue = value;
    }
}
