import type { CardData } from "./CardTypes";

export class Deck {
  public cards: CardData[];

  constructor(cards: CardData[] = []) {
    this.cards = cards;
  }

  add(card: CardData) {
    this.cards.push(card);
  }
}
