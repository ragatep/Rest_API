'use strict';
const { Model, DataTypes } = require('sequelize');
const bcryptjs = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {}
  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'A first name is required.',},
        notEmpty: {msg: 'Please provide a first name.',},
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'A last name is required.',},
        notEmpty: {msg: 'Please provide a last name.',},
      },
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {msg: 'The email you entered already exists',},
      validate: {
        notNull: {msg: 'An email address is required.',},
        isEmail: {msg: 'Please provide a valid email address',},
      },
    },
    checkPassword: {
      type: DataTypes.VIRTUAL, // set a transient field.
      allowNull: false,
      validate: {
        notNull: {msg: 'A password is required.',},
        notEmpty: {msg: 'Please provide a password.',},
        len: {args: [8, 20],msg: 'The password should be between 8 and 20 characters in length',},
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(val) {
        if (val === this.checkPassword) {
          const hashedPassword = bcryptjs.hashSync(val, 10);
          this.setDataValue('password', hashedPassword);
        }
      },
      validate: {
        notNull: {msg: 'Both passwords must match',},
      },
    },
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
        as: 'user',
        foreignKey: {
            fieldName: 'userId',
            allowNull: false,
        },
    });
  };

  return User;
};
