const { describe, it, before } = require("mocha");
const { expect } = require("chai");
const request = require("supertest");
const sinon = require("sinon");

const CarService = require("./../../src/service/carService");
const SERVER_TEST_PORT = 4000;

const mocks = {
  validCar: require("./../mocks/valid-car.json"),
  validCarCategory: require("./../mocks/valid-carCategory.json"),
  validCustomer: require("./../mocks/valid-customer.json"),
};

describe("End2End API Suite test", () => {
  let app = {};
  let sandbox = {};

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  before(() => {
    const api = require("./../../src/api");
    const carService = new CarService({
      cars: "./../../database/cars.json",
    });
    const instance = api({ carService });

    app = {
      instance,
      server: instance.initialize(SERVER_TEST_PORT),
    };
  });

  describe("/calculateFinalPrice:post", () => {
    it("given a carCategory, customer and numberOfDays it should calculate final amount in real", async () => {
      const car = { ...mocks.validCar };
      const customer = {
        ...mocks.validCustomer,
        age: 50,
      };

      const carCategory = {
        ...mocks.validCarCategory,
        price: 37.6,
      };

      const numberOfDays = 5;

      const body = {
        customer,
        carCategory,
        numberOfDays,
      };

      sandbox
        .stub(
          app.instance.carService.carRepository,
          app.instance.carService.carRepository.find.name
        )
        .resolves(car);

      const expected = {
        result: app.instance.carService.currencyFormat.format(244.4),
      };

      const response = await request(app.server)
        .post("/calculateFinalPrice")
        .send(body)
        .expect(200);

      expect(response.body).to.be.deep.equal(expected);
    });
  });

  describe("/getAvailableCar:get", () => {
    it("given a carCategory it should return an available car", async () => {
      const car = mocks.validCar;
      const carCategory = {
        ...mocks.validCarCategory,
        carIds: [car.id],
      };

      sandbox
        .stub(
          app.instance.carService.carRepository,
          app.instance.carService.carRepository.find.name
        )
        .resolves(car);

      const expected = {
        result: car,
      };

      const response = await request(app.server)
        .post("/getAvailableCar")
        .send(carCategory)
        .expect(200);

      expect(response.body).to.be.deep.equal(expected);
    });
  });

  describe("/rent:post", () => {
    it("given a customer and a car category it should return a transaction receipt", async () => {
      const car = mocks.validCar;
      const carCategory = {
        ...mocks.validCarCategory,
        price: 37.6,
        carIds: [car.id],
      };

      const customer = {
        ...mocks.validCustomer,
        age: 20,
      };

      const numberOfDays = 5;

      // age: 20, tax: 1.1, categoryPrice: 37.6
      // 37.6 * 1.1 = 41.36 * 5 days = 206.8
      const expectedAmount =
        app.instance.carService.currencyFormat.format(206.8);
      const dueDate = "10 de novembro de 2020";

      const body = {
        customer,
        carCategory,
        numberOfDays,
      };

      const now = new Date(2020, 10, 5);
      sandbox.useFakeTimers(now.getTime());

      sandbox
        .stub(
          app.instance.carService.carRepository,
          app.instance.carService.carRepository.find.name
        )
        .resolves(car);

      const expected = {
        result: {
          customer,
          car,
          amount: expectedAmount,
          dueDate,
        },
      };

      const response = await request(app.server)
        .post("/rent")
        .send(body)
        .expect(200);

      expect(JSON.stringify(response.body)).to.be.deep.equal(
        JSON.stringify(expected)
      );
    });
  });
});
