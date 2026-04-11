import { Merchant } from "../models";

/**
 * Finds the first merchant whose description matchers match the provided raw description.
 * Iterates merchants in the given order; first regex hit wins.
 */
export function findFirstMatchingMerchant(
  rawDescription: string,
  merchants: Merchant[],
): Merchant | undefined {
  for (const merchant of merchants) {
    if (
      !merchant.descriptionMatchers ||
      merchant.descriptionMatchers.length === 0
    ) {
      continue;
    }
    for (const pattern of merchant.descriptionMatchers) {
      try {
        const regex = new RegExp(pattern, "i");
        if (regex.test(rawDescription)) {
          return merchant;
        }
      } catch (e) {
        continue;
      }
    }
  }
  return undefined;
}
