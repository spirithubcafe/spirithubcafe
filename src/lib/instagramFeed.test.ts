import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeInstagramPost,
  parsePinnedPermalinks,
  selectInstagramPosts,
  splitCaption,
  truncate,
} from './instagramFeed.ts';

const feedItem = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  mediaType: 'IMAGE',
  mediaUrl: `https://cdn.example.com/${id}.jpg`,
  permalink: `https://www.instagram.com/p/${id}/`,
  caption: `Post ${id}`,
  timestamp: '2026-10-01T10:00:00+0000',
  ...overrides,
});

test('videos use the thumbnail, never the mp4', () => {
  const post = normalizeInstagramPost(feedItem('v1', {
    mediaType: 'VIDEO',
    mediaUrl: 'https://cdn.example.com/v1.mp4',
    thumbnailUrl: 'https://cdn.example.com/v1.jpg',
  }));
  assert.equal(post?.imageUrl, 'https://cdn.example.com/v1.jpg');
  assert.equal(normalizeInstagramPost(feedItem('v2', { mediaType: 'VIDEO', thumbnailUrl: undefined })), null);
});

test('accepts raw Graph API field names too', () => {
  const post = normalizeInstagramPost({
    id: 'g1',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://cdn.example.com/g1.jpg',
    permalink: 'https://www.instagram.com/p/g1/',
  });
  assert.equal(post?.mediaType, 'CAROUSEL_ALBUM');
  assert.equal(post?.timestamp, 0);
});

test('rejects unknown types, foreign permalinks and non-https images', () => {
  assert.equal(normalizeInstagramPost(feedItem('x', { mediaType: 'STORY' })), null);
  assert.equal(normalizeInstagramPost(feedItem('x', { permalink: 'https://evil.example/p/x' })), null);
  assert.equal(normalizeInstagramPost(feedItem('x', { mediaUrl: 'http://cdn.example.com/x.jpg' })), null);
  assert.equal(normalizeInstagramPost(null), null);
});

test('orders pinned permalinks first, then newest, de-duplicated and limited', () => {
  const items = [
    feedItem('old', { timestamp: '2026-01-01T00:00:00+0000' }),
    feedItem('new', { timestamp: '2026-09-01T00:00:00+0000' }),
    feedItem('pin', { timestamp: '2025-01-01T00:00:00+0000' }),
    feedItem('new', { timestamp: '2026-09-01T00:00:00+0000' }),
  ];
  const ids = selectInstagramPosts(items, {
    limit: 2,
    pinnedPermalinks: ['https://www.instagram.com/p/pin/'],
  }).map((post) => post.id);
  assert.deepEqual(ids, ['pin', 'new']);
});

test('splitCaption: first line is the title, hashtags dropped from the summary', () => {
  assert.deepEqual(
    splitCaption('New harvest: Kenya AA\nBright and juicy. #coffee #kenya\n\n#specialty'),
    { title: 'New harvest: Kenya AA', summary: 'Bright and juicy.' },
  );
});

test('splitCaption: a long single line is split at the first sentence', () => {
  const caption = `In the highlands of Kirinyaga, coffee is shaped by a community. ${'More text here. '.repeat(10)}`;
  const { title, summary } = splitCaption(caption);
  assert.equal(title, 'In the highlands of Kirinyaga, coffee is shaped by a community.');
  assert.ok(summary.startsWith('More text here.'));
  assert.ok(summary.length <= 141);
});

test('splitCaption handles Arabic punctuation and empty captions', () => {
  assert.equal(splitCaption('محصول جديد؟ نعم\nتفاصيل').title, 'محصول جديد؟ نعم');
  assert.deepEqual(splitCaption(undefined), { title: '', summary: '' });
});

test('truncate cuts at a word boundary', () => {
  const out = truncate('word '.repeat(60).trim(), 30);
  assert.ok(out.length <= 31 && out.endsWith('…'));
  assert.equal(truncate('short', 30), 'short');
});

test('parsePinnedPermalinks splits and trims', () => {
  assert.deepEqual(parsePinnedPermalinks(' a , ,b '), ['a', 'b']);
  assert.deepEqual(parsePinnedPermalinks(undefined), []);
});
