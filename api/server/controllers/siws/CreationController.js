const createSignInData = async () => {
  const now = new Date();
  //   const uri = window.location.href;
  //   const currentUrl = new URL(uri);

  // Convert the Date object to a string
  const currentDateTime = now.toISOString();

  // signInData can be kept empty in most cases: all fields are optional
  // const signInData: SolanaSignInInput = {};

  const signInData = {
    statement:
      'Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.',
    version: '1',
    // nonce: 'oBbLoEldZs',
    chainId: 'mainnet',
    issuedAt: currentDateTime,
    // resources: ['https://example.com', 'https://phantom.app/'],
  };
  return signInData;
};

const creationController = async (req, res) => {
  res.status(200).json(await createSignInData());
};

module.exports = { creationController };
