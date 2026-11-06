import { LATEST_RELEASE_ID, RELEASES, type Release } from '@/types/whatsNew/whatsNew-type';
import { unseenReleases, whatsNewStorageKey } from './whatsNew';

const release = (id: string): Release => ({ id, title: id, items: [{ icon: 'info', title: 'a', text: 'b' }] });
const LIST = [release('c'), release('b'), release('a')];

describe('unseenReleases', () => {
  it('gives only the newest to someone who has seen nothing', () => {
    expect(unseenReleases(LIST, null).map((r) => r.id)).toEqual(['c']);
  });

  it('gives nothing to someone who has seen the newest', () => {
    expect(unseenReleases(LIST, 'c')).toEqual([]);
  });

  it('gives everything newer than the last one seen, newest first', () => {
    expect(unseenReleases(LIST, 'a').map((r) => r.id)).toEqual(['c', 'b']);
    expect(unseenReleases(LIST, 'b').map((r) => r.id)).toEqual(['c']);
  });

  it('gives only the newest when the id seen is not in the list any more', () => {
    expect(unseenReleases(LIST, 'gone').map((r) => r.id)).toEqual(['c']);
  });

  it('has nothing to give without releases', () => {
    expect(unseenReleases([], null)).toEqual([]);
  });
});

describe('the releases of the app', () => {
  it('have ids that are never repeated, and the latest is the first', () => {
    const ids = RELEASES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LATEST_RELEASE_ID).toBe(ids[0]);
  });

  it('say something: a title and at least one item with all its fields', () => {
    for (const r of RELEASES) {
      expect(r.title.trim()).not.toBe('');
      expect(r.items.length).toBeGreaterThan(0);
      for (const item of r.items) {
        expect(item.icon.trim()).not.toBe('');
        expect(item.title.trim()).not.toBe('');
        expect(item.text.trim()).not.toBe('');
      }
    }
  });
});

describe('whatsNewStorageKey', () => {
  it('is one for each account', () => {
    expect(whatsNewStorageKey('u1')).not.toBe(whatsNewStorageKey('u2'));
  });
});
