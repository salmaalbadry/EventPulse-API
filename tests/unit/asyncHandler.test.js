const { expect } = require('chai');
const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  it('should pass through successful async functions', async () => {
    let called = false;

    const wrapped = asyncHandler(async (req, res, next) => {
      called = true;
      res.statusCode = 200;
      res.data = 'ok';
      next();
    });

    const req = {};
    const res = {};
    let nextCalled = false;

    await wrapped(req, res, () => {
      nextCalled = true;
    });

    expect(called).to.equal(true);
    expect(nextCalled).to.equal(true);
  });

  it('should call next when async function rejects', async () => {
    const wrapped = asyncHandler(async () => {
      throw new Error('boom');
    });

    let nextCalledWith = null;

    await wrapped({}, {}, (err) => {
      nextCalledWith = err;
    });

    expect(nextCalledWith).to.be.instanceOf(Error);
    expect(nextCalledWith.message).to.equal('boom');
  });
});
