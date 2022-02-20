export const chunkify = <T>(array: T[], chunkSize: number): T[][] => {
  const R = [];
  for (let i = 0, len = array.length; i < len; i += chunkSize) {
    R.push(array.slice(i, i + chunkSize));
  }
  return R;
};
