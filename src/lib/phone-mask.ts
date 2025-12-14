export function formatPhoneNumber(value: string): string {
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, "");

  // Ограничиваем до 12 цифр (белорусский формат: +375XXXXXXXXX)
  const limited = numbers.slice(0, 12);

  // Форматируем: +375 (XX) XXX-XX-XX
  if (limited.length === 0) return "";
  if (limited.length <= 3) return `+${limited}`;
  if (limited.length <= 5) return `+${limited.slice(0, 3)} (${limited.slice(3)}`;
  if (limited.length <= 8)
    return `+${limited.slice(0, 3)} (${limited.slice(3, 5)}) ${limited.slice(5)}`;
  if (limited.length <= 10)
    return `+${limited.slice(0, 3)} (${limited.slice(3, 5)}) ${limited.slice(5, 8)}-${limited.slice(8)}`;
  return `+${limited.slice(0, 3)} (${limited.slice(3, 5)}) ${limited.slice(5, 8)}-${limited.slice(8, 10)}-${limited.slice(10)}`;
}

export function validatePhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "");
  // Белорусский формат: +375 + 9 цифр = 12 цифр
  return numbers.length === 12 && numbers.startsWith("375");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

