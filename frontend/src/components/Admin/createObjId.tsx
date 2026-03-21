// utils/generateId.ts
export function createObjId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16); // 4 bytes (8 chars)
  const random = Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0"); // 3 bytes (6 chars)
  const counter = Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0"); // 3 bytes (6 chars)
  const machineId = Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0"); // 3 bytes (6 chars)
  return `${timestamp}${machineId}${random}${counter}`.slice(0, 24); // Ensure exactly 24 chars
}
