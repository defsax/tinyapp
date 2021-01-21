const { assert } = require('chai');

const { checkEmailExist } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('#getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = checkEmailExist(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";

    // Write your assert statement here
    assert.equal(user, expectedOutput);
  });

  it('should return undefined if email isn\'t present in object', function() {
    const user = checkEmailExist(testUsers, "user@notthere.com");
    const expectedOutput = undefined;

    // Write your assert statement here
    assert.equal(user, expectedOutput);
  });
});