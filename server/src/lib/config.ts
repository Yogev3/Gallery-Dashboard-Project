import * as Joi from 'joi'

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  MONGO_URI: Joi.string().default('mongodb://localhost:27017'),
  MONGO_DB_NAME: Joi.string().default('events_db'),
  EVENTS_COLL: Joi.string().default('new-events'),
  SOURCES_COLL: Joi.string().default('sources'),
  USE_MOCK: Joi.boolean().default(true),
  RESTART_URL: Joi.string().uri().required(),
})
