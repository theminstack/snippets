import { hash } from './hash-djb2a';

test('hash-djb2a', () => {
  expect(hash('').value).toBe(5381);
  expect(hash('🦄🌈').value).toBe(1_484_783_307);
  expect(hash('h').value).toBe(177_613);
  expect(hash('he').value).toBe(5_861_128);
  expect(hash('hel').value).toBe(193_417_316);
  expect(hash('hell').value).toBe(2_087_804_040);
  expect(hash('hello').value).toBe(178_056_679);
  expect(hash('hello ').value).toBe(1_580_903_143);
  expect(hash('hello w').value).toBe(630_196_144);
  expect(hash('hello wo').value).toBe(3_616_603_615);
  expect(hash('hello wor').value).toBe(3_383_802_317);
  expect(hash('hello worl').value).toBe(4_291_293_953);
  expect(hash('hello world').value).toBe(4_173_747_013);
  expect(
    hash(
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.',
    ).value,
  ).toBe(1_122_617_945);
  expect(hash('hello world').seed).toBe(-121_220_283);
  expect(hash('world', hash('hello ')).value).toBe(hash('hello world').value);
  const result = hash('hello world');
  expect(result.value).toBe(result.valueOf());
});
