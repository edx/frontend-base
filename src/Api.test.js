import {
  modifyObjectKeys,
  camelCaseObject,
  snakeCaseObject,
  convertKeyNames,
  get,
  del,
  head,
  options,
  patch,
  post,
  put,
  request,
} from './Api';
import App from './App';

describe('modifyObjectKeys', () => {
  it('should use the provided modify function to change all keys in and object and its children', () => {
    function meowKeys(key) {
      return `${key}Meow`;
    }

    const result = modifyObjectKeys(
      {
        one: undefined,
        two: null,
        three: '',
        four: 0,
        five: NaN,
        six: [1, 2, { seven: 'woof' }],
        eight: { nine: { ten: 'bark' }, eleven: true },
      },
      meowKeys,
    );

    expect(result).toEqual({
      oneMeow: undefined,
      twoMeow: null,
      threeMeow: '',
      fourMeow: 0,
      fiveMeow: NaN,
      sixMeow: [1, 2, { sevenMeow: 'woof' }],
      eightMeow: { nineMeow: { tenMeow: 'bark' }, elevenMeow: true },
    });
  });
});

describe('camelCaseObject', () => {
  it('should make everything camelCase', () => {
    const result = camelCaseObject({
      what_now: 'brown cow',
      but_who: { says_you_people: 'okay then', but_how: { will_we_even_know: 'the song is over' } },
      'dot.dot.dot': 123,
    });

    expect(result).toEqual({
      whatNow: 'brown cow',
      butWho: { saysYouPeople: 'okay then', butHow: { willWeEvenKnow: 'the song is over' } },
      dotDotDot: 123,
    });
  });
});

describe('snakeCaseObject', () => {
  it('should make everything snake_case', () => {
    const result = snakeCaseObject({
      whatNow: 'brown cow',
      butWho: { saysYouPeople: 'okay then', butHow: { willWeEvenKnow: 'the song is over' } },
      'dot.dot.dot': 123,
    });

    expect(result).toEqual({
      what_now: 'brown cow',
      but_who: { says_you_people: 'okay then', but_how: { will_we_even_know: 'the song is over' } },
      dot_dot_dot: 123,
    });
  });
});

describe('convertKeyNames', () => {
  it('should replace the specified keynames', () => {
    const result = convertKeyNames(
      {
        one: { two: { three: 'four' } },
        five: 'six',
      },
      {
        two: 'blue',
        five: 'alive',
        seven: 'heaven',
      },
    );

    expect(result).toEqual({
      one: { blue: { three: 'four' } },
      alive: 'six',
    });
  });
});

describe('isKnownError', () => {
  it('returns false for unknowne errors', () => {
    // TODO: write test
  });

  it('returns true for known errors', () => {
    // TODO: write test
  });
});

describe('formatKnownError', () => {
  it('fills out fieldErrors, errors, and messages properly', () => {
    // TODO: write test
  });
});

describe('axios passthroughs', () => {
  beforeEach(() => {
    App.apiClient = {
      get: jest.fn(async () => ({ data: { foo_bar: 'get' } })),
      delete: jest.fn(async () => ({ data: { foo_bar: 'del' } })),
      head: jest.fn(async () => ({ data: { foo_bar: 'head' } })),
      options: jest.fn(async () => ({ data: { foo_bar: 'options' } })),
      patch: jest.fn(async () => ({ data: { foo_bar: 'patch' } })),
      post: jest.fn(async () => ({ data: { foo_bar: 'post' } })),
      put: jest.fn(async () => ({ data: { foo_bar: 'put' } })),
    };
  });

  describe('get', () => {
    it('should pass parameters through to get', async () => {
      const result = await get('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'get' });
      expect(App.apiClient.get).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('del', () => {
    it('should pass parameters through to delete', async () => {
      const result = await del('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'del' });
      expect(App.apiClient.delete).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('head', () => {
    it('should pass parameters through to head', async () => {
      const result = await head('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'head' });
      expect(App.apiClient.head).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('options', () => {
    it('should pass parameters through to options', async () => {
      const result = await options('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'options' });
      expect(App.apiClient.options).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('patch', () => {
    it('should pass parameters through to patch', async () => {
      const result = await patch('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'patch' });
      expect(App.apiClient.patch).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('post', () => {
    it('should pass parameters through to post', async () => {
      const result = await post('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'post' });
      expect(App.apiClient.post).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('put', () => {
    it('should pass parameters through to put', async () => {
      const result = await put('a', 'b', 'c');
      expect(result).toEqual({ fooBar: 'put' });
      expect(App.apiClient.put).toHaveBeenCalledWith('a', 'b', 'c');
    });
  });

  describe('request', () => {
    it('should re-throw unexpected errors as-is', async (done) => {
      const error = new Error('original error');
      error.response = { no_data_here: 'hah' };
      App.apiClient.get = jest.fn(async () => {
        throw error;
      });

      try {
        await request('get', 'a', 'b', 'c');
      } catch (blah) {
        expect(blah).toEqual(error);
        done();
      }
    });

    it('should format expected errors', async (done) => {
      const error = new Error();
      error.response = {
        data: {
          field_errors: [{ this_error_has: 'field errors' }],
          errors: [{ this_error_has: 'errors' }],
          messages: [{ this_error_has: 'messages' }],
        },
      };
      App.apiClient.get = jest.fn(async () => {
        throw error;
      });
      try {
        await request('get', 'a', 'b', 'c');
      } catch (e) {
        expect(e.fieldErrors).toEqual([{ thisErrorHas: 'field errors' }]);
        expect(e.errors).toEqual([{ thisErrorHas: 'errors' }]);
        expect(e.messages).toEqual([{ thisErrorHas: 'messages' }]);
        done();
      }
    });
  });
});
