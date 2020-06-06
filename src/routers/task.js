const express = require('express');
const Task = require('../models/task.js');
const auth = require('../middleware/auth.js');

const router = new express.Router();


router.post('/tasks', auth, async(req, res) => {
   // const task = new Task(req.body);
    const task = new Task({
        ...req.body,//spread operator
        owner: req.user._id
    })
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send();
    }
    // task.save().then(() => {
    //     res.status(201).send(task);
    // }).catch((e) => {
    //     res.status(400).send();
    // });
});

//GET /tasks req.query?completed=true
//GET /tasks req.query?limit=2&skip=0 Pagination
//GET /tasks req.query?sortBy=createdAt:desc
router.get('/tasks', auth, async(req, res) => {
    const match = {};
    const sort = {};
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'; //because we are getting string query as true or false
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':'); //split the value ['createdAt', 'desc]
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1;
    }

    try {
        // const tasks = await Task.find({owner: req.user._id, completed: match.completed},  { skip: 5, limit: 5 });
        // res.send(tasks);

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate(); //Search using virtual populate method
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }

    // Task.find({}).then((tasks) => {
    //     res.send(tasks);
    // }).catch((e) => {
    //     res.status(500).send();
    // });
});

router.get('/tasks/:id', auth, async(req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id, owner: req.user._id});//Double check for _id and the owner of the task
        if(!task) {
            return res.status(404).send();
        }   
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
    // Task.findById(_id).then((task) => {
    //     if(!task) {
    //         return res.status(404).send();
    //     }

    //     res.send(task);
    // }).catch((e) => {
    //     res.status(500).send();
    // });
});

router.patch('/tasks/:id', auth, async(req, res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));//arr.every return boolean

    if(!isValidOperation) {
        return res.status(400).send('error: Invalid Updates');
    }//isValidOperation checks if the inputs are present in the db to be updated.
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}); //findByIdAndUpdate(id, update, {new: return new user data})
        if(!task) {
            return res.status(404).send();
        }
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send();
    }
});


router.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id});
        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});


module.exports = router;

