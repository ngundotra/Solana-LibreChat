const passport = require('passport');
const PassportLocalStrategy = require('passport-local').Strategy;
const { verifySignIn } = require('@solana/wallet-standard-util');

const User = require('../models/User');
const DebugControl = require('../utils/debug.js');

const validate = (input, rawOutput) => {
  // Deserailize the input
  const output = {
    account: {
      address: rawOutput['account']['address'],
      publicKey: Uint8Array.from(rawOutput['account']['publicKey']),
    },
    signature: Buffer.from(rawOutput['signature']),
    signedMessage: Buffer.from(rawOutput['signedMessage']),
  };
  return verifySignIn(input, output);
};

const solanaLogin = new PassportLocalStrategy(
  {
    usernameField: 'input',
    passwordField: 'output',
    session: false,
    passReqToCallback: true,
  },
  async (req, rawInput, rawOutput, done) => {
    const input = JSON.parse(rawInput);
    const output = JSON.parse(rawOutput);
    const success = validate(input, output);
    const address = output['account']['address'];
    if (!success) {
      log({
        title: 'Passport Solana Strategy - Validation Error',
        parameters: [{ name: 'req.body', value: req.body }],
      });
      return done(null, false, { message: 'Sign In verification failed!' });
    }

    let user;
    try {
      user = await User.findOne({ username: address });
      if (!user) {
        user = await User.create({
          username: address,
          name: address,
          email: `${address}@solana.blockchain`,
        });
      }
    } catch (err) {
      return done(err);
    }
    return done(null, user);
  },
);

passport.use(solanaLogin);

function log({ title, parameters }) {
  DebugControl.log.functionName(title);
  if (parameters) {
    DebugControl.log.parameters(parameters);
  }
}
