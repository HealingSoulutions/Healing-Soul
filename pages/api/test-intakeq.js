module.exports = function handler(req, res) {
  res.status(200).json({ hello: true, time: Date.now() });
};
