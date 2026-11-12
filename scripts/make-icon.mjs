import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), out.length - 4);
  return out;
}
const size = 256,
  raw = Buffer.alloc((size * 4 + 1) * size);
function lineDistance(x, y, x1, y1, x2, y2) {
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) /
        ((x2 - x1) ** 2 + (y2 - y1) ** 2),
    ),
  );
  return Math.hypot(x - x1 - t * (x2 - x1), y - y1 - t * (y2 - y1));
}
for (let y = 0; y < size; y++)
  for (let x = 0; x < size; x++) {
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    const inside =
      Math.hypot(Math.max(50 - x, 0, x - 205), Math.max(50 - y, 0, y - 205)) <
      35;
    const ink = [
      [99, 85, 57, 128],
      [57, 128, 99, 171],
      [157, 85, 199, 128],
      [199, 128, 157, 171],
      [142, 68, 114, 188],
    ].some((l) => lineDistance(x, y, ...l) < 7);
    const color = inside
      ? ink
        ? [255, 255, 255, 255]
        : [133, 121, 232, 255]
      : [0, 0, 0, 0];
    color.forEach((c, i) => (raw[offset + i] = c));
  }
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
mkdirSync("src-tauri/icons", { recursive: true });
writeFileSync("src-tauri/icons/icon.png", png);
writeFileSync("src-tauri/icons/icon.ico", Buffer.concat([header, png]));
