import { isResult, damageType } from "./lib";
import { stringToken } from "../arbs/output";

test.each([
	["de fogo", "fire"],
	["de luz", "light"],
	["de trevas", "dark"],
	["de raio", "bolt"],
	["de veneno", "poison"],
	["físico", "physical"],
])("normalizes Brazilian damage type %s", (input, expected) => {
	const parses = damageType([[stringToken(input)], 0]).filter(isResult);
	expect(parses).toHaveLength(1);
	expect(parses[0].result[0]).toBe(expected);
});
