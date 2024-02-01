const ShortUrl = require('../models/ShortUrl');

class ShortUrlRepository {
  async createUrl(urlData){
    return ShortUrl.create(urlData);
  }

  async getShortUrl(shortUrl){
    return ShortUrl.findOne({shortUrl: shortUrl});
  }

  async getLongUrlByShortUrl(shortUrl){
    return ShortUrl.findOne({shortUrl: shortUrl});
  }

  async getUserUrls(userId){
    return ShortUrl.find({userId});
  }

  async updateShortUrl(shortUrlId, shortUrlData){
    const updatedShortUrl = await ShortUrl.findOneAndUpdate(
        { _id:  shortUrlId},
        { $set: shortUrlData },
        { new: true }
    );
    return updatedShortUrl;
  }

  async deleteShortUrl(shortUrlId){
    const foundUrl = await ShortUrl.findOne({_id: shortUrlId});
    if(!foundUrl){
      return foundUrl;
    }
    return ShortUrl.deleteOne({_id: shortUrlId});
  }
}

module.exports = new ShortUrlRepository();
