import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().allow(''),
  DB_NAME: Joi.string().required(),

  REDIS_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(16).required(),

  AWS_S3_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),

  S3_ENDPOINT: Joi.string().uri().optional(),
  S3_FORCE_PATH_STYLE: Joi.string().valid('true', 'false').optional(),

  SWAGGER_TITLE: Joi.string().optional(),
  SWAGGER_DESC: Joi.string().optional(),
  SWAGGER_VERSION: Joi.string().optional(),

  SEED_ADMIN: Joi.string().valid('true', 'false').optional(),
  SEED_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().min(6).optional(),
  SEED_ADMIN_NAME: Joi.string().optional(),
  SEED_ADMIN_LICENSE: Joi.string().optional(),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().email().required(),
});
