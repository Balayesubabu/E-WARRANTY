import numberToWords from "number-to-words";
const { toWords } = numberToWords;

export const formatAmountInWords = (amount) => {
  if (amount === 0) return "Zero";

  let words = toWords(amount);

  // Capitalize each word
  words = words
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Replace singular units with plural
  words = words
    .replace(/\bThousand\b/g, "Thousands")
    .replace(/\bHundred\b/g, "Hundreds")
    .replace(/\bLakh\b/g, "Lakhs")
    .replace(/\bCrore\b/g, "Crores");

  return words;
};

export const numberFormatter = (value) => {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return "0";
};

export const dateFormatter = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


export const convertNumberToWords = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const numToWords = (num) => {
    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100)
      return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numToWords(num % 100000) : "")
      );
    return (
      numToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numToWords(num % 10000000) : "")
    );
  };

  const [rupees, paise] = amount.toFixed(2).split(".");
  let words = "";

  if (Number(rupees) > 0) {
    words += numToWords(parseInt(rupees)) + " Rupees";
  }

  if (Number(paise) > 0) {
    words += (words ? " and " : "") + numToWords(parseInt(paise)) + " Paise";
  }

  return words + " Only";
}