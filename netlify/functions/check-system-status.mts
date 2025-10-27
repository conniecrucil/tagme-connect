import type { Handler } from '@netlify/functions';

interface SystemStatus {
  stripe: {
    secretKey: boolean;
    publishableKey: boolean;
  };
  email: {
    resendApiKey: boolean;
    emailFrom: boolean;
    adminEmail: boolean;
    supportEmail: boolean;
  };
  company: {
    name: boolean;
    website: boolean;
  };
  aws: {
    accessKeyId: boolean;
    secretAccessKey: boolean;
    region: boolean;
    bucketName: boolean;
  };
  minio: {
    endpoint: boolean;
    accessKey: boolean;
    secretKey: boolean;
    bucketName: boolean;
    forcePathStyle: boolean;
    websiteEndpoint: boolean;
  };
  admin: {
    user: boolean;
    pass: boolean;
  };
  netlify: {
    siteUrl: boolean;
  };
  supabase: {
    url: boolean;
    anonKey: boolean;
    serviceRoleKey: boolean;
    databaseUrl: boolean;
  };
  postgres: {
    password: boolean;
    db: boolean;
    user: boolean;
    jwtSecret: boolean;
  };
}

/**
 * Check system status by verifying environment variables
 * Returns boolean flags for each required variable (never exposes actual values)
 */
export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check all required environment variables
    const status: SystemStatus = {
      stripe: {
        secretKey: !!process.env.STRIPE_SECRET_KEY,
        publishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      },
      email: {
        resendApiKey: !!process.env.RESEND_API_KEY,
        emailFrom: !!process.env.EMAIL_FROM,
        adminEmail: !!process.env.ADMIN_EMAIL,
        supportEmail: !!process.env.SUPPORT_EMAIL,
      },
      company: {
        name: !!process.env.COMPANY_NAME,
        website: !!process.env.COMPANY_WEBSITE,
      },
      aws: {
        accessKeyId: !!process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.APP_AWS_SECRET_ACCESS_KEY,
        region: !!process.env.APP_AWS_REGION,
        bucketName: !!process.env.VITE_AWS_S3_BUCKET_NAME,
      },
      s3BucketUrl: {
        bucketUrl: !!process.env.VITE_AWS_S3_BUCKET_URL,
      },
      admin: {
        user: !!process.env.ADMIN_USER,
        pass: !!process.env.ADMIN_PASS,
      },
      netlify: {
        siteUrl: !!process.env.NETLIFY_SITE_URL,
      },
      supabase: {
        url: !!process.env.SUPABASE_URL,
        anonKey: !!process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        databaseUrl: !!process.env.DATABASE_URL,
      },
      postgres: {
        password: !!process.env.POSTGRES_PASSWORD,
        db: !!process.env.POSTGRES_DB,
        user: !!process.env.POSTGRES_USER,
        jwtSecret: !!process.env.JWT_SECRET,
      },
    };

    // Calculate overall status
    const allRequired = [
      // Stripe (required for payments)
      status.stripe.secretKey,
      status.stripe.publishableKey,
      
      // Email (required for notifications)
      status.email.resendApiKey,
      status.email.emailFrom,
      status.email.adminEmail,
      status.email.supportEmail,
      
      // Company info (required for branding)
      status.company.name,
      status.company.website,
      
      // Admin auth (required for admin access)
      status.admin.user,
      status.admin.pass,
      
      // Supabase (required for database operations)
      status.supabase.url,
      status.supabase.anonKey,
      status.supabase.serviceRoleKey,
      status.supabase.databaseUrl,
      
      // MinIO (required for file storage in dev)
      status.minio.endpoint,
      status.minio.accessKey,
      status.minio.secretKey,
      status.minio.bucketName,
    ];

    const criticalServices = allRequired.filter(Boolean).length;
    const totalCritical = allRequired.length;
    const isHealthy = criticalServices === totalCritical;

    // AWS is optional for dev (MinIO is used instead)
    const awsServices = [
      status.aws.accessKeyId,
      status.aws.secretAccessKey,
      status.aws.region,
      status.aws.bucketName,
    ];
    const awsConfigured = awsServices.filter(Boolean).length;
    const totalAws = awsServices.length;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status,
        summary: {
          isHealthy,
          criticalServices,
          totalCritical,
          awsConfigured,
          totalAws,
          healthPercentage: Math.round((criticalServices / totalCritical) * 100),
        },
        lastChecked: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error checking system status:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to check system status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
