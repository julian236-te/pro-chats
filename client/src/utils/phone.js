// Shared phone normalization utility for Pro Chats
export function normalizePhone(p) {
  if (!p) return '';
  let digits = String(p).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  
  // Remove redundant zero after country code 20 for Egypt (e.g. 20011... -> 2011...)
  if (digits.startsWith('2001') && digits.length === 13) {
    digits = '20' + digits.slice(3);
  }
  // If starts with 01 and length 11 (e.g. 01116195859) -> 201116195859
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '20' + digits.slice(1);
  }
  // If starts with 1 and length 10 (e.g. 1116195859) -> 201116195859
  if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  }
  // Saudi numbers: e.g. 96605... -> 9665..., or 05... -> 9665...
  if (digits.startsWith('96605') && digits.length === 13) {
    digits = '966' + digits.slice(4);
  }
  if (digits.startsWith('05') && digits.length === 10) {
    digits = '966' + digits.slice(1);
  }
  return digits;
}

export function getChatId(phoneA, phoneB) {
  const p1 = normalizePhone(phoneA);
  const p2 = normalizePhone(phoneB);
  return [p1, p2].sort().join('__');
}
