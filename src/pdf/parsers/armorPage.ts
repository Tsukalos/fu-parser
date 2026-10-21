import {
	Parser,
	alt,
	cost,
	dashOrNumber,
	descriptionEnd,
	eof,
	fmap,
	image,
	kl,
	kr,
	many,
	many1,
	martial,
	matches,
	seq,
	str,
	strWithFont,
	success,
	text,
	then,
	optionalStar,
	watermark,
} from "./lib";
import { Armor, convertDef } from "../model/armor";
import { prettifyStrings } from "../parsers-commons";

const def = fmap(str, convertDef("DEX"));
const mdef = fmap(str, convertDef("INS"));

const init = dashOrNumber("initiative");

const armorDescription = fmap(
	then(
		many(strWithFont([/PTSans-Narrow$/, /PTSans-NarrowBold$/, /Heydings-Icons$/, /KozMinPro-Regular$/, /Type3$/])),
		descriptionEnd,
	),
	([z, s]) => prettifyStrings([...z, s]),
);

const armorParser: Parser<Armor> = fmap(
	seq(image, str, optionalStar, martial, cost, def, mdef, init, armorDescription),
	([image, name, _star, martial, cost, def, mdef, init, description]) => {
		return { image, name, martial, cost, def, mdef, init, description };
	},
);

const armorHeaderTitle = alt(
	alt(text("BASIC ARMORS"), text("ARMADURAS BÁSICAS")),
	alt(then(text("ARMADURAS E ESCUDOS BÁSICOS"), text("ARMADURAS BÁSICAS")), text("EXEMPLOS DE ARMADURAS RARAS")),
);
const armorHeaderColumns = seq(
	alt(alt(text("ARMOR"), text("ARMADURA")), text("ITEM")),
	alt(text("COST"), text("CUSTO")),
	alt(text("DEF"), text("DEFESA")),
	alt(alt(text("M.DEF"), text("DEF.M")), text("MDEF")),
	alt(alt(text("INIT"), text("INIC.")), alt(text("INIC"), alt(text("INICIATIVA"), text("INIC")))),
);
const armorHeader = seq(armorHeaderTitle, armorHeaderColumns);
const armorHeaderStart = alt(armorHeader, armorHeaderColumns);
const armorStarting = kr(many1(image), armorHeaderStart);

const pageNumber = matches(/^\d+$/, "page number");
const ornament = text("W");
const optionalWatermark = alt(watermark, success(null));
const chapterRank = text("MESTRE");
const chapterWord = text("CAPÍTULO");
const chapterNumber = matches(/^\d+$/, "chapter number");
const chapterFooter = seq(
	pageNumber,
	ornament,
	chapterNumber,
	chapterNumber,
	chapterRank,
	chapterWord,
	chapterWord,
	optionalWatermark,
);
const footer = alt(
	alt(
		alt(seq(image, pageNumber, ornament, optionalWatermark), seq(image, pageNumber, optionalWatermark)),
		alt(seq(pageNumber, ornament, optionalWatermark), seq(pageNumber, optionalWatermark)),
	),
	alt(seq(image, optionalWatermark), optionalWatermark),
);
const footerWithChapter = alt(seq(image, chapterFooter), alt(chapterFooter, footer));
const ending = then(
	alt(
		alt(then(text("BASIC ARMORS"), footerWithChapter), then(text("ARMADURAS BÁSICAS"), footerWithChapter)),
		footerWithChapter,
	),
	eof,
);

export const armorPage = kl(kr(armorStarting, many1(armorParser)), ending);
