import Configuration from '../models/Configuration.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

// Configuration cache
let configCache = null;
let cacheExpiry = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get all configurations
export const getAllConfigurations = async (req, res, next) => {
  try {
    const configs = await getConfigurationCache();

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    next(error);
  }
};

// Update configuration
export const updateConfiguration = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      throw new ValidationError('value is required');
    }

    const config = await Configuration.findOne({ key });
    if (!config) {
      throw new NotFoundError(`Configuration with key '${key}' not found`);
    }

    // Validate value type
    const expectedType = config.dataType;
    const actualType = typeof value;

    if (expectedType === 'number' && actualType !== 'number') {
      throw new ValidationError(`Value must be a number`);
    }
    if (expectedType === 'boolean' && actualType !== 'boolean') {
      throw new ValidationError(`Value must be a boolean`);
    }
    if (expectedType === 'string' && actualType !== 'string') {
      throw new ValidationError(`Value must be a string`);
    }

    config.value = value;
    config.metadata.updatedAt = new Date();
    await config.save();

    // Invalidate cache
    invalidateConfigCache();

    res.json({
      success: true,
      data: config,
      message: `Configuration '${key}' updated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Get configuration with caching
export const getConfigurationCache = async () => {
  // Return cached config if still valid
  if (configCache && cacheExpiry && cacheExpiry > Date.now()) {
    return configCache;
  }

  // Fetch fresh configuration
  const configs = await Configuration.find({});

  // Transform to key-value object
  configCache = configs.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {});

  cacheExpiry = Date.now() + CACHE_TTL;

  return configCache;
};

// Helper: Invalidate cache
export const invalidateConfigCache = () => {
  configCache = null;
  cacheExpiry = null;
};
