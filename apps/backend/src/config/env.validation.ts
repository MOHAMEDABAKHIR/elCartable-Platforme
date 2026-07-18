import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_ACCESS_SECRET doit contenir au moins 32 caractères.',
  })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET doit contenir au moins 32 caractères.',
  })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  IP_HASH_SALT?: string;
}

/**
 * Valeurs par défaut/exemple qui ne doivent JAMAIS être utilisées en
 * production : elles sont publiques (présentes dans .env.example ou le code)
 * et rendraient les tokens JWT forgeables ou l'anonymisation des IP réversible.
 */
const FORBIDDEN_PRODUCTION_SECRETS = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'change-me-ip-salt',
  'dev-only-salt-change-me',
]);

function assertProductionSecrets(config: EnvironmentVariables) {
  const problems: string[] = [];

  if (!config.IP_HASH_SALT) {
    problems.push('IP_HASH_SALT est requis en production.');
  }

  const secrets: Array<[string, string | undefined]> = [
    ['JWT_ACCESS_SECRET', config.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET],
    ['IP_HASH_SALT', config.IP_HASH_SALT],
  ];

  for (const [name, value] of secrets) {
    if (value && FORBIDDEN_PRODUCTION_SECRETS.has(value)) {
      problems.push(`${name} utilise une valeur par défaut interdite en production.`);
    }
  }

  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.');
  }

  return problems;
}

/**
 * Fails fast at boot if required env vars are missing/invalid, instead of
 * surfacing cryptic errors later at request time.
 */
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Configuration invalide au démarrage:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  if (validated.NODE_ENV === NodeEnv.Production) {
    const problems = assertProductionSecrets(validated);
    if (problems.length > 0) {
      throw new Error(`Configuration invalide au démarrage:\n${problems.join('\n')}`);
    }
  }

  return validated;
}
