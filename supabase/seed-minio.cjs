#!/usr/bin/env node

/**
 * MinIO Seeding Script
 * Creates fake VCF files and HTML content for seeded customers
 * This matches the hard-coded data in seed.sql
 */

const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client for MinIO
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tagme-dev';

// Customer data matching the SQL seed
const customers = [
  {
    uuid: 'alex-chen-techcorp-001',
    name: 'Alex Chen',
    email: 'alex.chen@techcorp.com',
    phone: '+1-555-0101',
    title: 'CTO',
    company: 'TechCorp',
    website: 'https://techcorp.com',
    description: 'Leading technology innovation and digital transformation initiatives.',
    street: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    postal: '94105',
    country: 'US',
    pronouns: 'he/him',
    prefix: 'Mr.',
    primaryActions: [
      { name: 'Email', value: 'alex.chen@techcorp.com', color: '#007bff' },
      { name: 'Call', value: '+1-555-0101', color: '#28a745' },
      { name: 'Website', value: 'https://techcorp.com', color: '#6f42c1' }
    ],
    secondaryActions: [
      { name: 'LinkedIn', value: 'https://linkedin.com/in/alexchen', color: '#0077b5' },
      { name: 'Twitter', value: 'https://twitter.com/alexchen', color: '#1da1f2' }
    ],
    hasLogo: true,
    hasPhoto: true,
    hasCover: false
  },
  {
    uuid: 'sarah-williams-design-002',
    name: 'Sarah Williams',
    email: 'sarah.williams@designstudio.com',
    phone: '+1-555-0102',
    title: 'Creative Director',
    company: 'Design Studio',
    website: 'https://designstudio.com',
    description: 'Passionate about creating beautiful, functional designs that tell compelling stories.',
    street: '456 Design Ave',
    city: 'New York',
    state: 'NY',
    postal: '10001',
    country: 'US',
    pronouns: 'she/her',
    prefix: 'Ms.',
    primaryActions: [
      { name: 'Email', value: 'sarah.williams@designstudio.com', color: '#007bff' },
      { name: 'Portfolio', value: 'https://sarahwilliams.design', color: '#e83e8c' },
      { name: 'Call', value: '+1-555-0102', color: '#28a745' }
    ],
    secondaryActions: [
      { name: 'Instagram', value: 'https://instagram.com/sarahdesigns', color: '#e4405f' },
      { name: 'Behance', value: 'https://behance.net/sarahwilliams', color: '#1769ff' }
    ],
    hasLogo: false,
    hasPhoto: true,
    hasCover: true
  }
];

/**
 * Generate vCard content
 */
function generateVCard(customer) {
  const lines = [];
  
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  lines.push(`FN:${customer.name}`);
  
  // Split name for N field
  const nameParts = customer.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  lines.push(`N:${lastName};${firstName};;;`);
  
  if (customer.company) {
    lines.push(`ORG:${customer.company}`);
  }
  
  if (customer.title) {
    lines.push(`TITLE:${customer.title}`);
  }
  
  if (customer.email) {
    lines.push(`EMAIL:${customer.email}`);
  }
  
  if (customer.phone) {
    lines.push(`TEL:${customer.phone}`);
  }
  
  if (customer.website) {
    lines.push(`URL:${customer.website}`);
  }
  
  // Add social media links
  customer.secondaryActions.forEach(action => {
    if (action.name.toLowerCase() === 'linkedin') {
      lines.push(`URL;TYPE=LINKEDIN:${action.value}`);
    } else if (action.name.toLowerCase() === 'twitter') {
      lines.push(`URL;TYPE=TWITTER:${action.value}`);
    } else if (action.name.toLowerCase() === 'instagram') {
      lines.push(`URL;TYPE=INSTAGRAM:${action.value}`);
    } else if (action.name.toLowerCase() === 'behance') {
      lines.push(`URL;TYPE=BEHANCE:${action.value}`);
    }
  });
  
  if (customer.description) {
    lines.push(`NOTE:${customer.description}`);
  }
  
  lines.push('END:VCARD');
  
  return lines.join('\n');
}

/**
 * Generate HTML content for contact card
 */
function generateHTML(customer) {
  const primaryButtons = customer.primaryActions.map(action => 
    `<a href="${action.value}" class="action-btn primary" style="background-color: ${action.color}">${action.name}</a>`
  ).join('\n    ');
  
  const secondaryButtons = customer.secondaryActions.map(action => 
    `<a href="${action.value}" class="action-btn secondary" style="background-color: ${action.color}">${action.name}</a>`
  ).join('\n    ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${customer.name} - Contact Card</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        .photo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #666;
        }
        .name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        }
        .title {
            font-size: 18px;
            color: #666;
            margin-bottom: 8px;
        }
        .company {
            font-size: 16px;
            color: #888;
            margin-bottom: 20px;
        }
        .description {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 30px;
        }
        .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .action-btn {
            padding: 12px 24px;
            border-radius: 25px;
            text-decoration: none;
            color: white;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .action-btn:hover {
            transform: translateY(-2px);
        }
        .secondary-actions {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .secondary-actions .action-btn {
            padding: 8px 16px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="photo">${customer.name.charAt(0)}</div>
        <h1 class="name">${customer.name}</h1>
        <div class="title">${customer.title}</div>
        <div class="company">${customer.company}</div>
        <div class="description">${customer.description}</div>
        
        <div class="actions">
            ${primaryButtons}
        </div>
        
        <div class="secondary-actions">
            ${secondaryButtons}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Ensure bucket exists
 */
async function ensureBucketExists() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket ${BUCKET_NAME} already exists`);
  } catch (error) {
    if (error.name === 'NotFound') {
      // Bucket doesn't exist, create it
      console.log(`📦 Creating bucket: ${BUCKET_NAME}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ Bucket ${BUCKET_NAME} created successfully`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload file to MinIO
 */
async function uploadToMinIO(key, content, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    });
    
    await s3Client.send(command);
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error.message);
  }
}

/**
 * Create fake image placeholder
 */
function createFakeImage(width = 200, height = 200, text = 'IMG') {
  // Create a simple SVG placeholder
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="#666">${text}</text>
  </svg>`;
}

/**
 * Main seeding function
 */
async function seedMinIO() {
  console.log(`🌱 Seeding MinIO bucket: ${BUCKET_NAME}`);
  console.log(`📡 MinIO endpoint: ${process.env.S3_ENDPOINT || 'http://localhost:9000'}`);
  
  // Ensure bucket exists
  await ensureBucketExists();
  
  for (const customer of customers) {
    console.log(`\n📝 Processing: ${customer.name}`);
    
    // Generate and upload VCF file only
    const vcardContent = generateVCard(customer);
    await uploadToMinIO(`${customer.uuid}/contact.vcf`, vcardContent, 'text/vcard');
  }
  
  console.log(`\n🎉 MinIO seeding completed!`);
  console.log(`\n📱 Access your seeded VCF files at:`);
  customers.forEach(customer => {
    console.log(`   http://localhost:9000/${BUCKET_NAME}/${customer.uuid}/contact.vcf`);
  });
}

// Run the seeding
if (require.main === module) {
  seedMinIO().catch(console.error);
}

module.exports = { seedMinIO, customers };
