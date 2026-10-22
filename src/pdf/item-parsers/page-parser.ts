import { asStringToken, FeatureToken, ItemToken, ItemWithImageToken, Token } from "../lexers/token";
import { itemizeTokens } from "./token-itemizer";
import "../../common/common.ts";
import { Item, ItemCategory } from "../model/common";
import { parseAccessory } from "./accessory-parser";
import { parseShield } from "./shield-parser";
import { parseArmor } from "./armor-parser";
import { parseWeapon } from "./weapon-parser";
import { parseWeaponModule } from "./weapon-module-parser";
import { parseCampActivity } from "./camp-activity-parser";

export function parsePage(pageData: Token[]): Map<ItemCategory, Item[]> {
	const watermark = pageData[pageData.length - 1];
	if (watermark.kind !== "String" || !/(Helvetica|BodoniOrnamentsITCTT)$/.test(asStringToken(watermark).font)) {
		throw new Error("Failed to parse page because it is not watermarked.");
	} else {
		const [itemTokensByCategory, optionalWeaponCategory] = itemizeTokens(pageData);
		return itemTokensByCategory.map((category, itemTokens) => {
			const items = itemTokens.map((token) => {
				const item = parseItem(category, token, optionalWeaponCategory);
				if (hasUndefinedProperty(item)) {
					throw new Error("Failed to parse one or more items on the page.");
				}
				return item;
			});
			return [category, items];
		});
	}
}

function parseItem(category: ItemCategory, itemToken: ItemToken, optionalWeaponCategory: string): Item {
	switch (category) {
		case "WEAPON":
			return parseWeapon(itemToken as ItemWithImageToken, optionalWeaponCategory);
		case "ARMOR":
			return parseArmor(itemToken as ItemWithImageToken);
		case "SHIELD":
			return parseShield(itemToken as ItemWithImageToken);
		case "ACCESSORY":
			return parseAccessory(itemToken as ItemWithImageToken);
		case "WEAPON MODULE":
			return parseWeaponModule(itemToken as ItemWithImageToken);
		case "CAMP ACTIVITY":
			return parseCampActivity(itemToken as FeatureToken);
		default:
			// This should never happen if `category` is properly typed
			throw new Error(`Unknown item category: ${category}`);
	}
}

function hasUndefinedProperty(item: Item): boolean {
	return Object.entries(item).some(([_, value]) => value === undefined);
}
