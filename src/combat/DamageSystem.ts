export class DamageSystem {
  applyDamage(target: any, amount: number) {
    // damage application placeholder
    if (target && typeof target.health === "number") {
      target.health -= amount;
    }
  }
}
