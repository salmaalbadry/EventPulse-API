const { expect } = require('chai');
const AppError = require('../../utils/AppError');

describe('AppError', () => {
  it('should create an error with status code and message', () => {
    const err = new AppError(404, 'Event not found');

    expect(err).to.be.instanceOf(Error);
    expect(err.statusCode).to.equal(404);
    expect(err.message).to.equal('Event not found');
    expect(err.isOperational).to.equal(true);
  });
});
