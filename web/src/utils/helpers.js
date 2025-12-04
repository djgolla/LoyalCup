// helpers.js
// misc helpers if we need to expand later

export function formatCurrency(num) {
  return `$${num.toFixed(2)}`;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
