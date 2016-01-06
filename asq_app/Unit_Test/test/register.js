/**
 * @author Ziyi Yan <yanziyi1991@gmail.com>
 * @date 12/09/2015
 * @description test cases for user registration
 */

var util = require('util');
var assert = require('assert');
var supertest = require('supertest');

require('../server');

/*************************** hook ndemailer ***********************************/
var sentEmail = {};
var mailer = require('nodemailer');
mailer._old_createTransport = mailer.createTransport;
mailer.createTransport = function (type, options) {
  var transport = mailer._old_createTransport(type, options);
  transport._old_sendMail = transport.sendMail;
  transport.sendMail = function (mail, callback) {
    // dump('send', mail);
    sentEmail[mail.to] = mail;
    transport._old_sendMail(mail, function (err, res) {
      if (err) throw err;
      callback(err, res);
      // dump('sent', mail);
    });
  };
  return transport;
};

function checkSentEmail(email) {
  return sentEmail[email] || false;
}

/****************************** util functions ********************************/
function request() {
  return supertest(global._express_app_instance);
}

function randomString(size, chars) {
  size = size || 6;
  var codes = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var max = codes.length + 1;
  var ret = '';
  while (size > 0) {
    ret += codes.charAt(Math.floor(Math.random() * max));
    size--;
  }
  return ret;
}

function generateEmail() {
  return randomString(10) + '@example.com';
}

function generatePassword() {
  return randomString(20);
}

function dump(obj) {
  console.log(util.inspect(obj, {
    colors: true,
    depth: 5,
  }));
}

function testLogin(email, password, callback) {
  request()
    .post('/login')
    .send({
      email: email,
      password: password,
    })
    .expect(function (res) {
      assert.equal(res.statusCode, 200);
      assert.ok(res.body);
      dump(res.body);
      assert.ok(res.body.email, email);
    })
    .end(callback);
}

function generateTestLogin(email, password, callback) {
  return function (err) {
    if (err) return callback(err);
    testLogin(email, password, callback);
  };
}

/******************************************************************************/

describe('/register', function () {

  var firstName = 'FN';
  var lastName = 'LN';
  var address1 = 'ADR1';
  var address2 = 'ADR2';
  var city = 'CT';
  var state = 'GD';
  var zipcode = '510000';
  var role = 'user';
  var activeIn = 'Y';
  var expiryDate = '03/09/2016';
  var subscriber = 'No';
  var birthDate = '12/09/2015';

  it('register success - only email & password', function (done) {
    var email = generateEmail();
    var password = generatePassword();
    request()
      .post('/register')
      .send({
        email: email,
        password: password
      })
      .expect(function (res) {
        assert.equal(res.statusCode, 200);
        assert.ok(res.body);
        dump(res.body);
        assert.ok(res.body.email, email);
      })
      .end(generateTestLogin(email, password, done));
  });

  it('register success - provide more information', function (done) {
    var email = generateEmail();
    var password = generatePassword();
    request()
      .post('/register')
      .send({
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        zipcode: zipcode,
        role: role,
        activeIn: activeIn,
        expiryDate: expiryDate,
        subscriber: subscriber,
        birthDate: birthDate,
      })
      .expect(function (res) {
        assert.equal(res.statusCode, 200);
        assert.ok(res.body);
        dump(res.body);
        assert.ok(res.body.email, email);
        assert.ok(res.body.firstName, firstName);
        assert.ok(res.body.lastName, lastName);
        assert.ok(res.body.address1, address1);
        assert.ok(res.body.address2, email);
        assert.ok(res.body.city, city);
        assert.ok(res.body.state, state);
        assert.ok(res.body.zipcode, zipcode);
        assert.ok(res.body.role, role);
        assert.ok(res.body.activeIn, activeIn);
        assert.ok(res.body.expiryDate, expiryDate);
        assert.ok(res.body.subscriber, subscriber);
        assert.ok(res.body.birthDate, birthDate);
      })
      .end(generateTestLogin(email, password, done));
  });

  it('send email success', function (done) {
    var email = generateEmail();
    var password = generatePassword();
    request()
      .post('/register')
      .send({
        email: email,
        password: password
      })
      .expect(function (res) {
        assert.equal(res.statusCode, 200);
        assert.ok(res.body);
        dump(res.body);
        assert.ok(res.body.email, email);
      })
      .end(function (err) {
        if (err) throw err;
        var mail = checkSentEmail(email);
        assert.ok(mail);
        dump(mail);
        done();
      });
  });

});
