const ShortUrlRepository = require('../repositories/ShortUrlRepository');
const UrlRepository = require('../repositories/ShortUrlRepository');
const crypto = require('crypto');

class ShortUrlService {

    async generateShortUrl() {
        // Generate a random 8-character string for the short URL
        const randomBytes = crypto.randomBytes(4);
        const randomNumbers = randomBytes.toString('hex').substring(0, 8);
        const shortUrl = `${randomNumbers}`;

        return shortUrl;
    }

    async createUrl(shortUrl, longUrl, userId){
        const foundShortUrl = await UrlRepository.getShortUrl(shortUrl);
        if(foundShortUrl){
            throw new Error("Url already exists");
        }
        return UrlRepository.createUrl({
            longUrl: longUrl,
            shortUrl,
            userId,
        });
    }

    async getLongUrl(shortUrl){
        const url = await ShortUrlRepository.getLongUrlByShortUrl(shortUrl); 
        if(!url){
            return url;
        }
        return url.longUrl;
    }

    async listUserUrls(userId){
        const list = await ShortUrlRepository.getUserUrls(userId); 

        return list;
    }

    async update(shortUrlId, shortUrlData){
        return await ShortUrlRepository.updateShortUrl(shortUrlId, shortUrlData);
    }

    async deleteShortUrl(shortUrlId){
        const deletedShortUrl = await ShortUrlRepository.deleteShortUrl(shortUrlId); 

        return deletedShortUrl;
    }

}

module.exports = new ShortUrlService();
