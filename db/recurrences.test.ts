import { api } from '@/api/client';
import { ApiError, NetworkError } from '@/api/errors';
import { deleteRecurrence } from './recurrences';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const apiMock = api as jest.MockedFunction<typeof api>;

beforeEach(() => apiMock.mockReset());

describe('deleteRecurrence', () => {
  it('asks the server to delete the recurrence, and everything it made, by its id', async () => {
    apiMock.mockResolvedValue(undefined);

    await deleteRecurrence(7);

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith('DELETE', '/v1/recurrences/7');
  });

  it('counts a repeated delete as done: it is gone already (404)', async () => {
    apiMock.mockRejectedValue(new ApiError(404, 'not_found', 'Recorrência não encontrada.'));

    await expect(deleteRecurrence(7)).resolves.toBeUndefined();
  });

  it('lets any other failure through, so the person is told and can try again', async () => {
    apiMock.mockRejectedValue(new ApiError(500, 'internal_error', 'Erro interno.'));
    await expect(deleteRecurrence(7)).rejects.toMatchObject({ status: 500 });

    apiMock.mockRejectedValue(new NetworkError());
    await expect(deleteRecurrence(7)).rejects.toBeInstanceOf(NetworkError);
  });
});
