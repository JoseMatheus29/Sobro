// What is left of the limit of a credit card. The bank counts against the limit everything bought and not paid yet,
// and the installments still to come of a purchase made in payments; this is the same count.
export interface CreditUsage {
  /** The limit of the card. */
  limit: number;
  /** Bought on credit and not paid yet, in invoices that are open or closed (never negative). */
  owed: number;
  /** Installments of purchases in payments that the server has not turned into a purchase yet (never negative). */
  committed: number;
  /** owed + committed. */
  used: number;
  /** limit - used: negative when the card is over its limit. */
  available: number;
  /** used / limit; 0 without a limit. */
  useShare: number;
}
