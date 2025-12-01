function getImageUrl(req, image) {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `${req.protocol}://${req.get('host')}/uploads/${image}`;
}

module.exports = { getImageUrl };