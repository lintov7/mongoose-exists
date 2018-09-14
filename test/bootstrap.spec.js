'use strict';


// force test environment
process.env.NODE_ENV = 'test';


// setup mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// mongoose.set('debug', true);


function wipe(done) {
  if (mongoose.connection && mongoose.connection.dropDatabase) {
    mongoose.connection.dropDatabase(done);
  } else {
    done();
  }
}


//setup database
before((done) => {
  mongoose.connect('mongodb://localhost/mongoose-exists', { useNewUrlParser: true },
    done);
});


// clear database
before(wipe);


// clear database
after(wipe);