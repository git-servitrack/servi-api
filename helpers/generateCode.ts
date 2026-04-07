type UniqueCodeOptions = {
  prefix: string;
  maxAttempts?: number;
  generateCandidate?: (prefix: string) => string;
  exists: (code: string) => Promise<boolean>;
};

const defaultCandidate = (prefix: string): string => {
  const datePart = Date.now().toString(36).toUpperCase().slice(-6);
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return prefix + "-" + datePart + randomPart;
};

export const generateUniqueCode = async (options: UniqueCodeOptions): Promise<string> => {
  const maxAttempts = options.maxAttempts ?? 8;
  const make = options.generateCandidate ?? defaultCandidate;

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = make(options.prefix);
    const taken = await options.exists(candidate);
    if (!taken) return candidate;
  }

  throw new Error("Unable to generate unique code");
};
