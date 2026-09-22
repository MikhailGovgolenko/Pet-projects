export const config = {
  donation: {
    paymentUrl: "https://www.tbank.ru/rm/r_mFtitMsPlB.HjwouTaRGO/yU86d66315",
  },
};

export function getDonationPaymentUrl(): string | null {
  const paymentUrl = config.donation.paymentUrl.trim();

  if (!paymentUrl || paymentUrl.includes("DONATION_PAYMENT_URL")) {
    return null;
  }

  try {
    const url = new URL(paymentUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
