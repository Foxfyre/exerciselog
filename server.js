const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)
let Schema = mongoose.Schema;

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
/*app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})*/

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const userSchema = new Schema({
  userName: {
    type: String,
    required: true
  },
  entry: [{
    exerDesc: String,
    exerDur: Number,
    exerDate: {
      type: Date,
      default: Date.now
    }
  }]
});



const user = mongoose.model("user", userSchema);

app.post("/api/exercise/:new-user", function(req, res) {
  let userName = req.body.username;
  console.log(req.body.username);
  user.findOne({userName: userName}, function (err, data) {
    if (err) return err;
    if (data != null) {
      res.json({
        userName: "User already exists"
      }); 
    } else {
      let newUser = new user({
        userName: userName,
        entry: []
      })
      newUser.save(function(err) {
        if (err) return err;
        });
        res.json({
          userName: userName,
          status: "created"
        })
    }
  });
});

app.post("/api/exercise/add", function(req, res) {
  console.log(req.body);
  const userId = req.body.userId;
  const date = (req.body.date) ? (new Date(req.body.date)) : (new Date());
  
  user.findByIdAndUpdate(userId,
    {$push: {entry: {
        exerDesc: req.body.description,
        exerDur: parseInt(req.body.duration),
        exerDate: date
    }}},
    {safe: true},
    function(err, data) {
      if(err){
        console.log(err);
      } else {
        res.json({update: "success"});
      }
  }) 
});

app.get('/api/exercise/log',(req,res) => {
  const userId = req.query.userId;
  const limit = parseInt(req.query.limit);
  const to = (req.query.to) ? new Date(req.query.to) : new Date();
  const from = (req.query.to) ? new Date(req.query.to) : new Date("1970-01-01");
  let entries = [];
  
  console.log(typeof(to));
  console.log(from);
  
  user.findById({
    _id: userId
  })
  .exec(function(err,data) {
    
  entries = data.entry;
    if (from !== undefined && to !== undefined) {
      entries = data.entry.filter(e => e.exerDate >= from && e.exerDate <= to); 
    } else if (from !== undefined && to === undefined) {
      entries = data.entry.filter(e => e.exerDate >= from);
    } else if (from === undefined && to !== undefined) {
      entries = data.entry.filter(e => e.exerDate <= to);
    }
    let limitEntries
    if (limit != undefined) {
      limitEntries = entries.slice(0,limit);
    } else {
      limitEntries = entries;
    }
    
    
      console.log(entries);
      //console.log(data.entry[0].exerDate < from);
      console.log(err);
      //console.log(data);
      res.json(limitEntries);
    })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
