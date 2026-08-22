/** Dispatched when Camp Caesar CTA should start nearest booking on /book. */
export const CAMP_CAESAR_BOOK_EVENT = "cut:camp-caesar-book";

export type CampCaesarBookDetail = {
  branchCode: string;
};

export function dispatchCampCaesarBook(branchCode: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CampCaesarBookDetail>(CAMP_CAESAR_BOOK_EVENT, {
      detail: { branchCode },
    }),
  );
}
