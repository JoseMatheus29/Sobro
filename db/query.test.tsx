import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, type UseQueryResult } from '@tanstack/react-query';

import { setActiveProfileId } from '@/api/activeProfile';
import { ActiveProfileIdContext } from '@/hooks/useActiveProfileId';
import { ProfileChangedError, useScreenQuery } from './query';

// A screen is always the one in front here.
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Result = UseQueryResult<string[], Error>;

interface ProbeProps {
  queryKey: readonly unknown[];
  queryFn: () => Promise<string[]>;
  keepPrevious?: boolean;
  account?: boolean;
  onResult: (result: Result) => void;
}

function Probe({ queryKey, queryFn, keepPrevious, account, onResult }: ProbeProps) {
  onResult(useScreenQuery({ queryKey, queryFn, keepPrevious, account }));
  return null;
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let latest: Result | null = null;
  const onResult = (result: Result) => {
    latest = result;
  };
  // The profile open is both what the screens render with (the context) and what the HTTP client reads.
  const tree = (profileId: string | null, props: Omit<ProbeProps, 'onResult'>) => (
    <QueryClientProvider client={client}>
      <ActiveProfileIdContext.Provider value={profileId}>
        <Probe {...props} onResult={onResult} />
      </ActiveProfileIdContext.Provider>
    </QueryClientProvider>
  );
  return { client, tree, result: () => latest as unknown as Result };
}

afterEach(() => setActiveProfileId(null));

describe('useScreenQuery', () => {
  it('keeps what it reads under the profile it was read for', async () => {
    const { client, tree } = setup();
    const queryFn = jest.fn(async () => ['x']);

    setActiveProfileId('mae');
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(tree('mae', { queryKey: ['cards'], queryFn }));
    });
    await flush();
    await act(async () => {
      setActiveProfileId(null);
      renderer.update(tree(null, { queryKey: ['cards'], queryFn }));
    });
    await flush();

    expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([
      ['mae', 'cards'],
      ['own', 'cards'],
    ]);
  });

  it('does not scope a read of the account itself', async () => {
    const { client, tree } = setup();
    setActiveProfileId('mae');

    await act(async () => {
      create(tree('mae', { queryKey: ['profile'], queryFn: async () => ['me'], account: true }));
    });
    await flush();

    expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([['profile']]);
  });

  it('never asks for a profile the app has already left', async () => {
    const { result, tree } = setup();
    const queryFn = jest.fn(async () => ['x']);
    // The screen still renders for the old profile, but the client already points at another one.
    setActiveProfileId('tio-ze');

    await act(async () => {
      create(tree('mae', { queryKey: ['cards'], queryFn }));
    });
    await flush();

    expect(queryFn).not.toHaveBeenCalled();
    expect(result().error).toBeInstanceOf(ProfileChangedError);
  });

  it('keeps the last answer while another month loads, but never the answer of another profile', async () => {
    const { result, tree } = setup();
    let release: (value: string[]) => void = () => {};
    const slow = () => new Promise<string[]>((resolve) => (release = resolve));

    setActiveProfileId('mae');
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(tree('mae', { queryKey: ['transactions', '2026-10'], queryFn: async () => ['da mãe'], keepPrevious: true }));
    });
    await flush();
    expect(result().data).toEqual(['da mãe']);

    // Another month of the same profile: the last answer stays until the new one comes.
    await act(async () => {
      renderer.update(tree('mae', { queryKey: ['transactions', '2026-09'], queryFn: slow, keepPrevious: true }));
    });
    expect(result().data).toEqual(['da mãe']);
    expect(result().isPlaceholderData).toBe(true);
    await act(async () => release(['setembro']));
    await flush();

    // Another profile: nothing of the last one is shown while its own data loads.
    await act(async () => {
      setActiveProfileId(null);
      renderer.update(tree(null, { queryKey: ['transactions', '2026-09'], queryFn: slow, keepPrevious: true }));
    });
    expect(result().data).toBeUndefined();
    expect(result().isPlaceholderData).toBe(false);
  });
});
