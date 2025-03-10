require('dotenv').config()

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var articlesRouter = require('./routes/articles')
var userModificationsRouter = require('./routes/userModifications')
var calendarRouter = require('./routes/calendar')
var emergenciesRouter = require('./routes/emergencies')
var contactRouter = require('./routes/contact')

var app = express();

const fileUpload = require('express-fileupload');
app.use(fileUpload());

const cors = require('cors')
app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/articles', articlesRouter);
app.use('/userModifications', userModificationsRouter);
app.use('/calendar', calendarRouter)
app.use('/emergencies', emergenciesRouter)
app.use('/contact', contactRouter)

module.exports = app;
