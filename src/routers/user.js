const express = require('express');
const multer = require('multer')
const sharp = require('sharp');//Cropping and Formatting images

const User = require('../models/user.js');
const auth = require('../middleware/auth.js');
const {sendWelcomingEmail, sendCancellationEmail} = require('../emails/account.js');

const router = new express.Router();



router.post('/users', async(req, res) => {
    const user = new User(req.body);
    
    try {
        await user.save();
        sendWelcomingEmail(user.name, user.email);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }


    // user.save().then(() => {
    //     res.status(201).send(user);
    // }).catch((e) => {
    //     res.status(400).send();
    // })
    
});

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);//findByCredentials is created by us in the userSchema 
        const token = await user.generateAuthToken();//token is generated for the current instance
        res.send({user, token});
    } catch (e) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {//Remove the Token from the tokens array
            return token.token !== req.token;
        });
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async(req, res) => {
    res.send(req.user);
});


router.patch('/users/me', auth, async(req, res) => {
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        return res.status(400).send('error: Invalid Updates');
    }//isValidOperation checks if the inputs are present in the db to be updated.
    try {
        updates.forEach((update) => req.user[update] = req.body[update]);//findByIdandUpdate rejects the middleware thats why we upadte dynamically
        await req.user.save();
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}); //findByIdAndUpdate(id, update, {new: return new user data})
        res.send(req.user);
    } catch (e) {
        res.status(400).send();
    }
});

router.delete('/users/me', auth, async(req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        // if(!user) {
        //     return res.status(404).send();
        // }
        // res.send(user);
        await req.user.remove(); //Mongoose function
        sendCancellationEmail(req.user.name, req.user.email);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

const upload = multer({//Creates avatars directory & handles validations
    // dest: 'avatars',//stores the file in the filesystem
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please only upload jpg, jpeg, png file'));
        }
        cb(undefined, true);
    }
})
//POST /users/me/avatar ->profile photo
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {//upload.single() is middleware
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer();
    
    req.user.avatar = buffer;//req.file contains the file that is uploaded
    
    await req.user.save();
    res.send();
}, (error, req, res, next) => {//handles errors for router
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    try {
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
    await req.user.save();
});

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;