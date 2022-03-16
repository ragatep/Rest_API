'use strict';

const express = require('express');

// Construct a router instance.
const router = express.Router();
// const User = require('./models').User;
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');

// Handler function to wrap each route.
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  };
}

/**
 * Users Routes
 */

// GET currently authenticated User.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.currentUser.id },
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
  });
  res.status(200).json({ user })
}));
// POST creates a new user and sets the location to '/.'
router.post('/users', asyncHandler(async (req, res) => {
  let user;
  try {
    user = await User.create(req.body);
    res.status(201)
      .location('/')
      .end();
  } catch (error) {
    console.log('ERROR: ', error.name);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      user = await User.build(req.body);
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

/**
 * Courses Routes
 */

// GET courses list. Including the user that owns each course.
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] },  
    include: [
      { model: User, as: 'user', attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt'] },},
    ], 
  });
  res.status(200).json(courses);
}));
// GET individual course. Including the user that owns each course.
router.get("/courses/:id", asyncHandler(async (req, res) => {
  const course = await Course.findOne({ 
    where: { id: req.params.id },
    attributes: { exclude: ['createdAt', 'updatedAt'] },  
    include: [
      { model: User, as: 'user', attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt'] },},
    ], 
  });
  // Handles errors
  if(course) {
    res.status(200).json({ message: 'Course Found!', course, });
  } else {
        res.status(404).json({ message: 'Course Not Found. :(' });
      }  
}));
// POST create a new course.
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  let course;
  try {
    course = await Course.create(req.body);
    // res.status(201).location("/courses/" + course.id).end();
    res.status(201)
      .location('/courses/' + course.id)
      .end();
  } catch (error) {
    console.log('ERROR: ', error.name);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      course = await Course.build(req.body);
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));
// PUT updates a course. Returns a 403 status code if the current user doesn't own the requested course.
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
  const user = req.currentUser;
  let course;
  try {
    course = await Course.findByPk(req.params.id);
    if (course) {
      if (course.userId === user.id) {
        await course.update(req.body);
        res.status(204)
          .end();
      } else {
        res.status(403).json({ message: 'You shall not edit!' });       
      }      
    } else {
      res.status(404).json({ message: 'Course Not Found. :(' });
    }  
  } catch (error) {
      console.log('ERROR: ', error.name);

      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        course = await Course.build(req.body);
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }   
  }
}));
// DELETE a course. Returns a 403 status code if the current user doesn't own the requested course.
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
  const user = req.currentUser;
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (course.userId === user.id) {
      await course.destroy();
      res.status(204)
        .end();  
    } else {
        res.status(403).json({ message: 'You shall not delete!' });       
    }
  } else {
    res.status(404).json({ message: 'Course Not Found. :(' });
  }
}));

module.exports = router;
