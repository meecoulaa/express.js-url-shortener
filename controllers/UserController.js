const User = require('../models/User');
const bcrypt = require('bcrypt');

const UserService = require('../service/UserService');
require('dotenv').config();

class UserController {

    /**
     * @swagger
     * tags:
     *   name: Users
     *   description: Operations related to Users
     */
    
    /**
     * @swagger
     * /users/{user_id}:
     *   get:
     *     summary: Update user details.
     *     description: Update user details for the specified user ID.
     *     tags:
     *       - Users
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema:
     *           type: string
     *           description: The ID of the user to find.
     *     
     *     responses:
     *       200:
     *         description: User updated successfully.
     *         content:
     *           application/json:
     *             example:
     *               message: User updated successfully
     *               user:
     *                 _id: user_id
     *                 email: newemail@example.com
     *                 name: New Name
     */

    async show(req,res){
        try{
            const user = await UserService.getById(req.params.user_id);

            if(!user){
                return res.status(404).json({error:'User not found'});
            }
            res.status(200).json(user);
        }catch(error){
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * @swagger
     * /users/update/{user_id}:
     *   put:
     *     summary: Update user details.
     *     description: Update user details for the specified user ID.
     *     tags:
     *       - Users
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema:
     *           type: string
     *           description: The ID of the user to update.
     *     requestBody:
     *       description: User data to update.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 description: New email for the user.
     *               name:
     *                 type: string
     *                 description: New name for the user.
     *               password:
     *                 type: string
     *                 description: New password for the user.
     *             example:
     *               email: newemail@example.com
     *               name: New Name
     *               password: newPassword
     *     responses:
     *       200:
     *         description: User updated successfully.
     *         content:
     *           application/json:
     *             example:
     *               message: User updated successfully
     *               user:
     *                 _id: user_id
     *                 email: newemail@example.com
     *                 name: New Name
     */
    async update(req,res){
        try{
            const userId = req.params.user_id;
            const userData = req.body;

            const updatedUser = await UserService.update(userId, userData);
            if(!updatedUser){
                return res.status(404).json({error:'User not updated'});
            }

            res.status(201).json({message: 'User updated successfully', user: updatedUser});
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
}

module.exports = new UserController();