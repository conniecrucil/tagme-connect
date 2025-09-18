import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
      },
    });
  }

  // Get credentials from environment variables
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  // Debug: Log environment variables (remove in production)
  console.log('ADMIN_USER:', adminUser);
  console.log('ADMIN_PASS:', adminPass);

  if (!adminUser || !adminPass) {
    return new Response(JSON.stringify({ 
      error: 'Admin credentials not configured',
      debug: { adminUser: !!adminUser, adminPass: !!adminPass }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Check for Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Access"',
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Decode the base64 credentials
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (username === adminUser && password === adminPass) {
      return new Response(JSON.stringify({ 
        authenticated: true,
        message: 'Authentication successful' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid authorization header' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
