import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies or headers
    const authHeader =
      request.headers.get('authorization') ||
      request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1];

    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Create a new request to the API
    const apiUrl = `${API_BASE_URL}/v1/events/subscribe`;
    const headers: Record<string, string> = {};

    if (authHeader.startsWith('Bearer ')) {
      headers['Authorization'] = authHeader;
    } else {
      headers['Authorization'] = `Bearer ${authHeader}`;
    }

    // Forward the request to the API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return new Response('Failed to connect to event stream', {
        status: response.status,
      });
    }

    // Create a readable stream to forward the SSE data
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();

        if (!reader) {
          controller.close();
          return;
        }

        function pump(): Promise<void> {
          return reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              controller.enqueue(value);
              return pump();
            })
            .catch(error => {
              console.error('Stream error:', error);
              controller.error(error);
            });
        }

        return pump();
      },
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Event subscription proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
