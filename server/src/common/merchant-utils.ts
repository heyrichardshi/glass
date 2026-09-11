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
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

/**
 * Tries each text in order against {@link findFirstMatchingMerchant}. First hit wins.
 * Plaid's `original_description`, `name` and `merchant_name` are often different strings
 * for the same merchant, so callers pass every one they have.
 */
export function findFirstMatchingMerchantFromTexts(
  texts: Array<string | null | undefined>,
  merchants: Merchant[],
): Merchant | undefined {
  for (const text of texts) {
    if (!text) {
      continue;
    }
    const match = findFirstMatchingMerchant(text, merchants);
    if (match) {
      return match;
    }
  }
}
