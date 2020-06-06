const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./routers/user.js');
const taskRouter = require('./routers/task.js');

const app = express();
const port = process.env.PORT;


app.use(express.json()); //To convert json data to object to pass from the request
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('Server is Up on port ' + port);
});



// const multer = require('multer');
// const upload = multer({
//     dest: 'images',
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb) {
//         if(!file.originalname.match(/\.(doc|docx)$/)) {//regular expression is used here
//             return cb(new Error('Please upload a Word Document'));
//         }
//         cb(undefined, true);//cb(error, true or false);
//     }
// });

// app.post('/upload', upload.single('upload'), (req, res) => {
//     res.send();
// }, (error, req, res, next) => {//handles error for the router
//     res.status(400).send({error: error.message});
// });
