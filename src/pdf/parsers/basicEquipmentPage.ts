// v1.1 Core Rulebook basic weapons and consumables tables.
import {
	Parser,
	alt,
	bonus,
	cost,
	description,
	eof,
	fail,
	fmap,
	hands,
	image,
	inc,
	kl,
	kr,
	many,
	many1,
	matches,
	melee,
	nextToken,
	satisfy,
	seq,
	statsForAccuracy,
	statsForDamage,
	str,
	strWithFont,
	success,
	text,
	textWithFont,
	then,
	watermark,
} from "./lib";
import { isImageToken, isStringToken, Token } from "../lexers/token";
import { Weapon } from "../model/weapon";
import { Consumable } from "../model/consumable";
import { DamageType, WEAPON_CATEGORIES, WeaponCategory } from "../model/common";

const ICON = /FabulaUltimaicons-Regular$/;
const bracketOpen = textWithFont("(", [ICON]);
const bracketClose = textWithFont(")", [ICON]);
const sep = textWithFont("•", [ICON]);

const accuracy = fmap(
	then(kl(kr(bracketOpen, statsForAccuracy), bracketClose), bonus),
	([[primary, secondary], b]) => ({
		primary,
		secondary,
		bonus: b,
	}),
);
const damage = kl(kr(bracketOpen, statsForDamage), bracketClose);
const martial = alt(
	fmap(textWithFont("W", [/Type3$/]), () => true),
	success(false),
);
const damageType = fmap(strWithFont([/PTSans-NarrowBold$/]), (s) => {
	const normalized = s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/^(de|do|da|dos|das)\s+/, "");
	const types: Record<string, DamageType> = {
		fisico: "physical",
		ar: "air",
		raio: "bolt",
		trevas: "dark",
		terra: "earth",
		fogo: "fire",
		gelo: "ice",
		luz: "light",
		veneno: "poison",
	};
	return (types[normalized] ?? normalized) as DamageType;
});

const weaponListing: Parser<Omit<Weapon, "category">> = fmap(
	seq(
		image,
		strWithFont([/PTSans-NarrowBold$/]),
		martial,
		cost,
		accuracy,
		damage,
		damageType,
		kl(hands, sep),
		kl(melee, sep),
		description,
	),
	([image, name, martial, cost, accuracy, damage, damageType, hands, melee, description]) => ({
		image,
		name,
		martial,
		cost,
		damage,
		accuracy,
		damageType,
		hands,
		melee,
		description,
	}),
);

function asWeaponCategory(s: string, ptr: [Token[], number]) {
	if ((WEAPON_CATEGORIES as readonly string[]).includes(s)) {
		return success(s as WeaponCategory)(inc(ptr));
	}
	return fail<WeaponCategory>(`Unexpected category ${s}`)(ptr);
}

const categoryTitle: Parser<WeaponCategory> = (ptr) => {
	const token = nextToken(ptr);
	if (token && isStringToken(token)) {
		const raw = token.string.endsWith(" Category")
			? token.string.slice(0, -9)
			: token.string.replace(/^Categoria[s]? de /, "");
		if (raw !== token.string || token.string.endsWith(" Category")) {
			const aliases: Record<string, WeaponCategory> = {
				arcana: "arcane",
				"armas arcanas": "arcane",
				arco: "bow",
				arcos: "bow",
				luta: "brawling",
				"armas de luta": "brawling",
				adaga: "dagger",
				adagas: "dagger",
				"arma de fogo": "firearm",
				"armas de fogo": "firearm",
				malho: "flail",
				malhos: "flail",
				pesada: "heavy",
				pesadas: "heavy",
				lança: "spear",
				lanças: "spear",
				espada: "sword",
				espadas: "sword",
				arremessável: "thrown",
				arremesso: "thrown",
			};
			const category = aliases[raw.toLowerCase().replace(/^armas /, "armas ")] ?? raw.toLowerCase();
			return asWeaponCategory(category, ptr);
		}
	}
	return fail<WeaponCategory>("Category")(ptr);
};

const weaponsBlock: Parser<Weapon[]> = fmap(then(categoryTitle, many1(weaponListing)), ([category, weapons]) =>
	weapons.map((v) => ({ ...v, category })),
);

// Page decoration, page number and table header are images or non-item fonts
const PREAMBLE_FONTS = [/Antonio-Regular$/, /Antonio-Bold$/, /BodoniOrnamentsITCTT$/, /CreditValley$/];
const preambleTokens = many(
	satisfy((t) => isImageToken(t) || (isStringToken(t) && PREAMBLE_FONTS.some((f) => f.test(t.font))), "preamble"),
);
const ending = then(alt(then(alt(text("BASIC WEAPONS"), text("ARMAS BÁSICAS")), watermark), watermark), eof);

export const basicWeaponsV11: Parser<Weapon[]> = fmap(kl(kr(preambleTokens, many1(weaponsBlock)), ending), (k) =>
	k.flat(1),
);

const consumable: Parser<Consumable> = fmap(
	seq(
		image,
		fmap(many1(strWithFont([/PTSans-NarrowBold$/])), (s) => s.join(" ")),
		fmap(matches(/^[0-9]+$/, "ipCost"), (s) => Number(s)),
		description,
	),
	([image, name, ipCost, description]) => ({ image, name, ipCost, description }),
);

const consumableHeader = matches(/^[^.?!]*$/, "header");

export const consumablesV11: Parser<[string, Consumable[]][]> = kl(
	kr(seq(image, many1(str)), many1(then(consumableHeader, many1(consumable)))),
	then(str, then(watermark, eof)),
);
