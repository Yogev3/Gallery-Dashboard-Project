import * as Joi from 'joi'

export const configValidationSchema = Joi.object({
  PORT: Joi.number().required(),
  MONGO_URI: Joi.string().required(),
  MONGO_DB_NAME: Joi.string().required(),
  EVENTS_COLL: Joi.string().required(),
  SOURCES_COLL: Joi.string().required(),
  USE_MOCK: Joi.boolean().required(),
  RESTART_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().required(),
})
