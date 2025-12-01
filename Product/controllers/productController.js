const productService = require("../services/productService");
const { getImageUrl } = require("../utils/imageHelper");
const { createProductSchema } = require("../validation/productValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

// 🧹 Clean incoming form-data body
const normalizeBody = (body) => {
  const normalized = {};
  for (const key in body) {
    const cleanKey = key.trim();
    let val = body[key];
    if (Array.isArray(val)) {
      const pick = val.find(v => v && v.toString().trim() !== "") || val[0];
      val = pick;
    }
    if (typeof val === "string") val = val.trim();
    normalized[cleanKey] = val;
  }
  return normalized;
};

//  Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("ProductController: getProductById - API Request initiated", { productId: id });

    const cacheKey = `product:${id}`;

    // Try Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("ProductController: getProductById - Product fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.PRODUCT_FETCH_SUCCESS,
        data: parsed,
      });
    }

    // Fetch from DB
    const resp = await productService.getProductById(id);

    if (!resp.success) {
      logger.warn("ProductController: getProductById - Product not found", { productId: id });
      return res.status(resp.statusCode || STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    const product = { ...resp.data, image: getImageUrl(req, resp.data.image) };

    // Cache in Redis
    await redisClient.setEx(cacheKey, 600, JSON.stringify(product));
    logger.info("ProductController: getProductById - Product cached in Redis", { cacheKey });

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.PRODUCT_FETCH_SUCCESS,
      data: product,
    });
  } catch (error) {
    logger.error("ProductController: getProductById - Unexpected error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

//  Get all products (with Redis caching)
exports.getAllProducts = async (req, res) => {
  try {
    logger.info("ProductController: getAllProducts - API Request initiated", { query: req.query });

    const { page = 1, limit = 10, category, sortBy, order, minPrice, maxPrice } = req.query;

    const cacheKey = `products:${page}:${limit}:${category || "all"}:${sortBy || "name"}:${order || "asc"}:${minPrice || "min"}:${maxPrice || "max"}`;

    // 1️ Try Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("ProductController: getAllProducts - Products fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.PRODUCTS_FETCH_SUCCESS_CACHE,
        total: parsed.total,
        page: parsed.page,
        pages: parsed.pages,
        data: parsed.data,
      });
    }

    // 2️ Fetch from DB
    const resp = await productService.getAllProducts({
      page,
      limit,
      category,
      sortBy,
      order,
      minPrice,
      maxPrice,
    });

    if (!resp.success) {
      logger.error("ProductController: getAllProducts - ProductService failed", { message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Map image URLs
    const productsWithImageUrls = resp.data.map(p => ({ ...p, image: getImageUrl(req, p.image) }));

    const result = {
      total: resp.total,
      page: resp.page,
      pages: resp.pages,
      data: productsWithImageUrls,
    };

    // 3️ Cache in Redis
    if (result.data && result.data.length > 0) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
      logger.info("ProductController: getAllProducts - Products cached in Redis", { cacheKey });
    } else {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(result));
      logger.info("ProductController: getAllProducts - Empty product list cached", { cacheKey });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.PRODUCTS_FETCH_SUCCESS_DB,
      ...result,
    });
  } catch (error) {
    logger.error("ProductController: getAllProducts - Unexpected error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

//  Add new product (Admin only)
exports.addProduct = async (req, res) => {
  try {
    logger.debug("ProductController: addProduct - Incoming request", { body: req.body, file: req.file });

    let productData = normalizeBody(req.body);

    // Parse variants
    if (productData.variants && typeof productData.variants === "string") {
      try {
        productData.variants = JSON.parse(productData.variants);
        if (Array.isArray(productData.variants)) {
          productData.variants = productData.variants.map(v => ({
            ...v,
            price: Number(v.price) || undefined,
            stock: Number(v.stock) || 0,
          }));
        }
      } catch (err) {
        logger.warn("ProductController: addProduct - Invalid JSON for variants", { error: err.message });
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION_ERROR + ": Invalid JSON for variants.",
          data: MESSAGES.DATA_NULL,
        });
      }
    }

    // Convert to numbers
    if (productData.price !== undefined) productData.price = Number(productData.price);
    if (productData.stock !== undefined) productData.stock = Number(productData.stock);

    // Attach image
    if (req.file) productData.image = req.file.filename;

    logger.info("ProductController: addProduct - Normalized data", { productData });

    // Validation
    const { error } = createProductSchema.validate(productData);
    if (error) {
      logger.warn("ProductController: addProduct - Validation failed", { details: error.details[0].message });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.VALIDATION_ERROR + `: ${error.details[0].message}`,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Call service
    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      logger.warn("ProductController: addProduct - Service failed", { message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    const product = {
      ...resp.data.toObject(),
      image: getImageUrl(req, resp.data.image),
    };

    // Clear cache
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info("ProductController: addProduct - Redis cache cleared", { clearedKeys: keys.length });
    }

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.PRODUCT_ADDED_SUCCESS,
      data: product,
    });
  } catch (error) {
    logger.error("ProductController: addProduct - Unexpected error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};