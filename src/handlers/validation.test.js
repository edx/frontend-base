import validation from './validation';

it('should validate that the configuration document is correct', async () => {
  const app = {
    config: {
      foo: 'bar',
      buh: 'okay',
    },
  };

  // This is checking 1) that the promise resolved and 2) that the return value is undefined, which
  // is what we want.
  await expect(validation(app)).resolves.toBe(undefined);
});

it('should validate that the configuration document is correct', async () => {
  const app = {
    config: {
      foo: 'bar',
      buh: undefined,
    },
  };

  await expect(validation(app)).rejects.toThrow();
});
