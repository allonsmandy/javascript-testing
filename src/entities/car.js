const Base = require("./base/base");

class Car extends Base {
  constructor({ id, name, releaseYear, available, hasAvailable }) {
    super({ id, name });

    this.releaseYear = releaseYear;
    this.available = available;
    this.hasAvailable = hasAvailable;
  }
}

module.exports = Car;
