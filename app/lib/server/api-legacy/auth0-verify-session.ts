import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Initialize JWKS client to fetch Auth0 public keys
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    callback(new Error('No kid in header'));
    return;
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    if (!key) {
      callback(new Error('No signing key returned'));
      return;
    }
    
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export default async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'No token provided' }),
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: process.env.AUTH0_AUDIENCE || `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    // Token is valid
    return new Response(
      JSON.stringify({
        authenticated: true,
        user: decoded,
      }),
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Auth verification error:', error);
    
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }),
      {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
