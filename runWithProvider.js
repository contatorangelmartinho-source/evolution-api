const dotenv = require('dotenv');
const { execSync } = require('child_process');
const { existsSync } = require('fs');

// override: false = variáveis do ambiente (Render/Railway) têm prioridade sobre .env
dotenv.config({ override: false });

const { DATABASE_PROVIDER } = process.env;
const databaseProviderDefault = DATABASE_PROVIDER ?? 'postgresql';

if (!DATABASE_PROVIDER) {
  console.warn(`DATABASE_PROVIDER is not set in the .env file, using default: ${databaseProviderDefault}`);
}

// Mapeia DATABASE_URL -> DATABASE_CONNECTION_URI se necessário
if (process.env.DATABASE_URL && !process.env.DATABASE_CONNECTION_URI) {
  process.env.DATABASE_CONNECTION_URI = process.env.DATABASE_URL;
}

function getMigrationsFolder(provider) {
  switch (provider) {
    case 'psql_bouncer':
      return './prisma/psql_bouncer-migrations';
    case 'postgresql':
    default:
      return './prisma/postgresql-migrations';
  }
}

function getSchemaFile(provider) {
  switch (provider) {
    case 'psql_bouncer':
      return './prisma/psql_bouncer-schema.prisma';
    case 'postgresql':
    default:
      return './prisma/postgresql-schema.prisma';
  }
}

const provider = databaseProviderDefault;
const migrationsFolder = getMigrationsFolder(provider);
const schemaFile = getSchemaFile(provider);

if (!existsSync(migrationsFolder)) {
  console.error(`Migrations folder not found: ${migrationsFolder}`);
  process.exit(1);
}

const command = process.argv[2];

if (command) {
  try {
    const resolvedCommand = command
      .replace('DATABASE_PROVIDER', provider)
      .replace('./prisma/migrations', migrationsFolder)
      .replace('./prisma/DATABASE_PROVIDER-schema.prisma', schemaFile);
    
    console.log(`Running: ${resolvedCommand}`);
    execSync(resolvedCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_CONNECTION_URI: process.env.DATABASE_CONNECTION_URI || process.env.DATABASE_URL,
      }
    });
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
} else {
  // Start the application
  try {
    execSync('node dist/main.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_CONNECTION_URI: process.env.DATABASE_CONNECTION_URI || process.env.DATABASE_URL,
      }
    });
  } catch (error) {
    process.exit(1);
  }
}
