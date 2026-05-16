import { http, HttpResponse } from 'msw';

const API_BASE = '/api'; // Adjusted if necessary

export const handlers = [
  // Auth
  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body: any = await request.json();
    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
        }
      });
    }
    return HttpResponse.json(
      { success: false, error: { message: 'Invalid credentials' } },
      { status: 401 }
    );
  }),

  // Projects
  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'proj-1',
          title: 'Test Project',
          status: 'DRAFT',
          currentStage: 'script',
          lastEditedAt: new Date().toISOString(),
          storageSizeBytes: '1048576'
        }
      ]
    });
  }),
];
