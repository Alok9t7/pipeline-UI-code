export const MSG = {
  regexName: 'Name is required and must match ^[A-Za-z0-9\\-_]{1,64}$',
  typeMustBe: (t: string) => `Type is required and must be "${t}"`,
  required: (label: string) => `${label} is required`,
  atLeastOne: (label: string) => `At least one ${label} is required`,
  uri: 'Must be a valid https:// or s3:// URI',
  maxLen: (n: number) => `Must be at most ${n} characters long`,
  itemRegex: 'Each item must match ^[A-Za-z0-9\\-_]{1,64}$',
} as const;
