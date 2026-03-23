export function buildBaseBoardCode(name) {
  const words = String(name)
    .toUpperCase()
    .match(/[A-Z0-9]+/g);

  if (!words || words.length === 0) {
    return "BRD";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3) || "BRD";
  }

  return words.map((word) => word[0]).join("").slice(0, 6) || "BRD";
}

export async function generateUniqueBoardCode(BoardModel, name) {
  const baseCode = buildBaseBoardCode(name);
  let code = baseCode;
  let suffix = 2;

  // Ensure board code uniqueness while preserving readable base acronym.
  // Example: WSD, WSD2, WSD3...
  // eslint-disable-next-line no-await-in-loop
  while (await BoardModel.findOne({ code })) {
    code = `${baseCode}${suffix}`;
    suffix += 1;
  }

  return code;
}

export async function ensureBoardCode(BoardModel, boardDoc) {
  if (boardDoc.code) {
    return boardDoc;
  }

  boardDoc.code = await generateUniqueBoardCode(BoardModel, boardDoc.name || "Board");
  await boardDoc.save();
  return boardDoc;
}
