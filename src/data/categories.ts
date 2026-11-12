export type CategoryId = "cars" | "bikes" | "scooters" | "ev" | "commercial";

export type Category = {
  id: CategoryId;
  label: string;
  singular: string;
  blurb: string;
};

export const CATEGORIES: Category[] = [
  { id: "cars", label: "Cars", singular: "car", blurb: "Hatchbacks, sedans, SUVs and MUVs" },
  { id: "bikes", label: "Bikes", singular: "bike", blurb: "Commuter, sports, cruiser and adventure" },
  { id: "scooters", label: "Scooters", singular: "scooter", blurb: "Everyday petrol scooters" },
  { id: "ev", label: "Electric Vehicles", singular: "electric vehicle", blurb: "Electric cars and scooters" },
  { id: "commercial", label: "Commercial Vehicles", singular: "commercial vehicle", blurb: "Mini trucks, pickups and trucks" },
];

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}
