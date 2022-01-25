export class NonExistentWiki extends Error {
  constructor(interwiki: string) {
    super(`Wiki not found: ${interwiki}`);
  }
}
