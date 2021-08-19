class NonExistentUser extends Error {
  constructor(username: string) {
    super(`User account ${username} does not exist.`);
  }
}

export default NonExistentUser;
