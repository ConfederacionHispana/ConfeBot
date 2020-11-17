const Util = {
  formatDate(d = new Date()) {
    let month = String(d.getMonth() + 1);
    let day = String(d.getDate());
    const year = String(d.getFullYear());

    if (month.length < 2) month = `0${month}`;
    if (day.length < 2) day = `0${day}`;

    return `${day}/${month}/${year}`;
  },

  parseBlockExpiry(str) {
    const y = str.substr(0, 4),
      m = str.substr(4, 2) - 1,
      d = str.substr(6, 2);
    const D = new Date(y, m, d);
    return (D.getFullYear() === parseInt(y, 10) && D.getMonth() === parseInt(m, 10) && D.getDate() === parseInt(d, 10)) ? D : 'invalid date';
  }
};

export const {
  formatDate,
  parseBlockExpiry
} = Util;
