import {
	Parser,
	alt,
	cost,
	dashOrNumber,
	description,
	eof,
	fmap,
	image,
	kl,
	kr,
	many1,
	martial,
	matches,
	seq,
	starting,
	str,
	strWithFont,
	success,
	text,
	then,
	optionalStar,
	watermark,
} from "./lib";
import { Shield } from "../model/shield";

const def = dashOrNumber("def");
const mdef = dashOrNumber("mdef");
const init = dashOrNumber("initiative");

const shieldParser: Parser<Shield> = fmap(
	seq(image, str, optionalStar, martial, cost, def, mdef, init, description),
	([image, name, _star, martial, cost, def, mdef, init, description]) => {
		return { image, name, martial, cost, def, mdef, init, description };
	},
);

const shieldHeaderTitle = alt(
	alt(text("BASIC SHIELDS"), text("ESCUDOS BÁSICOS")),
	alt(
		then(text("ARMADURAS E ESCUDOS BÁSICOS"), text("ESCUDOS BÁSICOS")),
		text("EXEMPLOS DE ESCUDOS RAROS"),
	),
);
const shieldHeader = seq(
	shieldHeaderTitle,
	alt(alt(text("SHIELD"), text("ESCUDO")), text("ITEM")),
	alt(text("COST"), text("CUSTO")),
	alt(text("DEF"), text("DEFESA")),
	alt(alt(text("M.DEF"), text("DEF.M")), text("MDEF")),
	alt(alt(text("INIT"), text("INIC.")), alt(text("INIC"), text("INICIATIVA"))),
);
const shieldHeaderStart = alt(then(shieldHeaderTitle, shieldHeader), shieldHeader);
const shieldStarting = alt(kr(many1(image), shieldHeaderStart), starting);

const pageNumber = matches(/^\d+$/, "page number");
const ornament = text("W");
const optionalWatermark = alt(watermark, success(null));
const chapterNumber = matches(/^\d+$/, "chapter number");
const chapterRankOrRules = alt(text("REGRAS DO JOGO"), text("MESTRE"));
const chapterLabel = text("CAPÍTULO");
const chapterFooter = seq(
	pageNumber,
	ornament,
	chapterNumber,
	chapterNumber,
	chapterRankOrRules,
	chapterLabel,
	chapterLabel,
	optionalWatermark,
);
const chapterFooterWithImage = seq(
	image,
	pageNumber,
	ornament,
	chapterNumber,
	chapterNumber,
	chapterRankOrRules,
	chapterLabel,
	chapterLabel,
	optionalWatermark,
);
const footer = alt(
	alt(
		alt(
			alt(seq(image, pageNumber, ornament, optionalWatermark), seq(image, pageNumber, optionalWatermark)),
			alt(seq(pageNumber, ornament, optionalWatermark), seq(pageNumber, optionalWatermark)),
		),
		alt(chapterFooterWithImage, chapterFooter),
	),
	alt(seq(image, optionalWatermark), optionalWatermark),
);
const flavorLine = strWithFont([/MonotypeCorsiva$/]);
const flavor = alt(seq(flavorLine, flavorLine), success([]));
const ending = then(
	alt(
		alt(
			then(text("BASIC SHIELDS"), kl(flavor, footer)),
			then(text("ESCUDOS BÁSICOS"), kl(flavor, footer)),
		),
		kl(flavor, footer),
	),
	eof,
);

export const shieldPage: Parser<Shield[]> = kl(kr(shieldStarting, many1(shieldParser)), ending);
