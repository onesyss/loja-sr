/** Limite alinhado à rota `POST /api/upload/product-image` (evita base64 gigante no Postgres). */
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_MB = 2;
