export type CardType = "slash" | "dash" | "spell" | "shield";

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  power: number;
}
