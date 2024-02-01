const { validationResult, check } = require('express-validator');
const ShortUrlService = require('../service/ShortUrlService');

class ShortUrlController {

/**
 * @swagger
 * tags:
 *   name: Url
 *   description: Operations related to URL
 */

/**
 * @swagger
 * /url/show-long-url/{short_url}:
 *   get:
 *     summary: Retrieve the long URL associated with a short URL
 *     description: Retrieve the long URL associated with a short URL identifier.
 *     tags: [Url]
 *     parameters:
 *       - in: path
 *         name: short_url
 *         required: true
 *         description: Short URL identifier
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Short URL found successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Long URL found successfully
 *               longUrl: "https://example.com/long-url"
 *       404:
 *         description: Long URL not found
 *         content:
 *           application/json:
 *             example:
 *               error: Long URL not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 */

    async show (req,res){
        try{
            const longUrl = await ShortUrlService.getLongUrl(req.params.short_url);

            if(!longUrl){
                return res.status(404).json({error: 'Long URL not found'});
            }
            return res.status(200).json({message: "Long url found successfully", longUrl: longUrl});
        }
        catch(error){
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

/**
 * @swagger
 * /url:
 *   post:
 *     summary: Generate a new short URL.
 *     description: Generate a new short URL representing a long URL.
 *     tags:
 *       - Url
 *     requestBody:
 *       description: URL data for creating a new short URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shortUrl:
 *                 type: string
 *                 description: Optional custom short URL. If not provided, a new one will be generated.
 *               longUrl:
 *                 type: string
 *                 description: Long URL to be shortened.
 *             example:
 *               shortUrl: customShortUrl
 *               longUrl: https://www.example.com/long-url
 *     responses:
 *       200:
 *         description: Short URL created successfully.
 *         content:
 *           application/json:
 *             example:
 *               shortUrl: customShortUrl
 *               longUrl: https://www.example.com/long-url
 *               userId: user_id
 *       400:
 *         description: Bad Request. Validation errors in the request.
 *         content:
 *           application/json:
 *             example:
 *               errors: [
 *                 {
 *                   msg: 'Short URL is required',
 *                   param: 'shortUrl',
 *                   location: 'body',
 *                 },
 *                 {
 *                   msg: 'Long URL is required',
 *                   param: 'longUrl',
 *                   location: 'body',
 *                 },
 *               ]
 *       403:
 *         description: Forbidden. Short URL already exists.
 *         content:
 *           application/json:
 *             example:
 *               message: 'Short URL already exists'
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               message: 'Internal Server Error'
 */
    
    async create (req,res){
        let { shortUrl, longUrl } = req.body;
        const userId = req.user.userId;
        try{
            if(!shortUrl){
                shortUrl = await ShortUrlService.generateShortUrl();
            }

            const url = await ShortUrlService.createUrl(shortUrl, longUrl, userId);
            return res.status(201).json(url);
        }
        catch(error){
            if(error.message === "Url already exists"){
                return res.status(403).json({message: "Url already exists"}); 
            }
            return res.status(500).json({message: "Internal Server Error"});
        }
    }


    /**
     * @swagger
     * /url/list:
     *   get:
     *     summary: Retrieve a list of URLs associated with the authenticated user
     *     description: Retrieve a list of URLs associated with the authenticated user.
     *     tags: [Url]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of URLs retrieved successfully
     *         content:
     *           application/json:
     *             example:
     *               - shortUrl: "short-url-1"
     *                 longUrl: "https://example.com/long-url-1"
     *               - shortUrl: "short-url-2"
     *                 longUrl: "https://example.com/long-url-2"
     *       404:
     *         description: No URLs found for the authenticated user
     *         content:
     *           application/json:
     *             example:
     *               error: No URLs found
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             example:
     *               message: Internal Server Error
     */
    async list (req,res){
        try{
            const list = await ShortUrlService.listUserUrls(req.user.userId);
            if(list.length === 0){
                return res.status(404).json({error: "No urls found"});
            }

            return res.status(200).json(list);
        }
        catch(error){
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    /**
     * @swagger
     * /url/update/{short_url_id}:
     *   put:
     *     summary: Update a short URL
     *     description: Update a short URL associated with the authenticated user.
     *     tags: [Url]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: short_url_id
     *         required: true
     *         description: ID of the short URL to be updated.
     *         schema:
     *           type: string
     *     requestBody:
     *       description: Short URL data for updating the existing short URL.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               shortUrl:
     *                 type: string
     *                 description: Optional custom short URL. If not provided, the existing one will be used.
     *               longUrl:
     *                 type: string
     *                 description: New long URL to be associated with the short URL.
     *             example:
     *               shortUrl: customShortUrl
     *               longUrl: https://www.example.com/new-long-url
     *     responses:
     *       201:
     *         description: Short URL updated successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Short URL updated successfully
     *               url:
     *                 shortUrl: customShortUrl
     *                 longUrl: https://www.example.com/new-long-url
     *       400:
     *         description: Invalid data input
     *         content:
     *           application/json:
     *             example:
     *               error: Invalid data input
     *       404:
     *         description: Short URL not updated
     *         content:
     *           application/json:
     *             example:
     *               error: Short URL not updated
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             example:
     *               error: Internal Server Error
     */

    async update(req,res){
        try{
            const updatedShortUrl = await ShortUrlService.update(req.params.short_url_id, req.body);
            if(!updatedShortUrl){
                return res.status(404).json({error:'Short URL not updated'});
            }

            res.status(201).json({message: 'Short URL updated successfully', url: updatedShortUrl});
        }
        catch(error){
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                res.status(400).json({ error: 'Invalid data input' });
                
            } else {
                // General error
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    /**
     * @swagger
     * /url/delete/{short_url_id}:
     *   delete:
     *     summary: Delete a short URL
     *     description: Delete a short URL associated with the authenticated user.
     *     tags: [Url]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: short_url_id
     *         required: true
     *         description: ID of the short URL to be deleted.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Short URL deleted successfully
     *         content:
     *           application/json:
     *             example:
     *               message: Short URL deleted successfully
     *       404:
     *         description: Short URL not found
     *         content:
     *           application/json:
     *             example:
     *               error: Short URL not found
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             example:
     *               message: Internal Server Error
     */
    async delete (req,res){
        try{
            const deletedShortUrl = await ShortUrlService.deleteShortUrl(req.params.short_url_id);
            if (!deletedShortUrl) {
                return res.status(404).json({ error: 'Short URL not found' });
            }

            return res.status(200).json({ message: 'Short URL deleted successfully' });

        }
        catch(error){
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

/**
 * @swagger
 * /url/{short_url}:
 *   get:
 *     summary: Redirect to the original long URL.
 *     description: Retrieve the original long URL associated with the provided short URL and redirect the user.
 *     tags:
 *       - Url
 *     parameters:
 *       - in: path
 *         name: short_url
 *         required: true
 *         schema:
 *           type: string
 *         description: The short URL to redirect from.
 *     responses:
 *       '302':
 *         description: Redirects the user to the original long URL.
 *       '404':
 *         description: Short URL not found.
 *         content:
 *           application/json:
 *             example:
 *               error: Url not found
 */

    async redirect(req,res){
        try{
            const longUrl = await ShortUrlService.getLongUrl(req.params.short_url);
            if(!longUrl){
                return res.status(404).json({error: 'Long URL not found'});
            }
            return res.status(301).redirect(longUrl);
        }
        catch(error){
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

module.exports = new ShortUrlController();