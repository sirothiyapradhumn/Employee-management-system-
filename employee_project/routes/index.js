var express = require('express');
var multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
var empModel = require('../modules/empDbConn');
var uploadModel = require('../modules/uploadDb');
var router = express.Router();
var employee = empModel.find({});
var imageData = uploadModel.find({});

router.get(express.static(__dirname+"./public/"));

if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}


var Storage = multer.diskStorage({
  destination:"./public/uploads/",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
  }
});

var upload = multer({
  storage:Storage
}).single('file');

/* GET home page. */
router.post('/upload', upload , function(req, res, next) {
    var imageFile=req.file.filename;
    var success = req.file.filename + " uploaded succesfully";

    var imageDetails= new uploadModel({
      imagename:imageFile,
    });
    imageDetails.save(function(err,doc){
      if(err) throw err;
      imageData.exec(function(err,data){
        if(err) throw err;
        res.render('upload-file', { title: 'Upload file', records:data , success:success });
      });
      

    });
});


function checkLogin(req,res,next){
  var myToken = localStorage.getItem('myToken');
  try {
    jwt.verify(myToken, 'loginToken');
  } catch(err) {
    res.send("you need to login to access this page");
  }
  next();
}

router.get('/upload',checkLogin, function(req, res, next) {
  imageData.exec(function(err,data){
    if(err) throw err;
  res.render('upload-file', { title: 'Upload file', records:data , success:'' });

  });
});

router.get('/', checkLogin ,function(req, res, next) {
  employee.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee records', records:data , success:'' });
  });
  
});

router.get('/login', function(req, res, next) {
  var token = jwt.sign({ foo: 'bar' }, 'loginToken');
  localStorage.setItem('myToken', token);
  res.send("login Successfully")
});

router.get('/logout', function(req, res, next) {
  localStorage.removeItem('myToken');
  res.send("Logout Successfully") 
});

router.post("/", function(req, res, next){
  var empDetails = new empModel({
    name:req.body.uname,
    email:req.body.email,
    etype:req.body.emptype,
    hourlyrate:req.body.hrlyrate,
    totalhour:req.body.totalhr,
    total : parseInt(req.body.hrlyrate) * parseInt(req.body.totalhr),
  });

//console.log(empDetails);
empDetails.save(function(err,res1){
  if(err) throw err;
  employee.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee records', records:data ,success:'Record Inserted Successfully'});
  });
});

   
});

router.post("/search/", function(req, res, next){
 
var fltrName = req.body.fltrname;
var fltrEmail = req.body.fltremail;
var fltrEmptype = req.body.fltremptype;

if(fltrName != '' && fltrEmail !='' && fltrEmptype !=''){
  var fltrParameter = { $and:[{ name:fltrName},
    { $and:[{ email:fltrEmail},{etype:fltrEmptype}]}
  ]

  }
}else if(fltrName != '' && fltrEmail =='' && fltrEmptype !=''){
  var fltrParameter = { $and:[{ name:fltrName},{etype:fltrEmptype}]
  }
} else if(fltrName == '' && fltrEmail !='' && fltrEmptype !=''){
  var fltrParameter = { $and:[{ email:fltrEmail},{etype:fltrEmptype}]
  }
}else if(fltrName == '' && fltrEmail =='' && fltrEmptype !=''){
  var fltrParameter = { etype:fltrEmptype
  }
}else {
    var fltrParameter={}
  }
  var employeeFilter = empModel.find(fltrParameter);
employeeFilter.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee records', records:data });
  });


  
});
  
router.get('/delete/:id', function(req, res, next) {
var id = req.params.id;
var del = empModel.findByIdAndDelete(id);

  del.exec(function(err){
    if(err) throw err;
    res.redirect("/");
  });
  
});

router.get('/edit/:id', function(req, res, next) {
  var id = req.params.id;
var edit = empModel.findById(id);
  edit.exec(function(err,data){
    if(err) throw err;
    res.render('edit', { title: 'Edit Employee record', records:data });
  });
  
});

router.post('/update/', function(req, res, next) {
  
var update = empModel.findByIdAndUpdate(req.body.id,{
    name:req.body.uname,
    email:req.body.email,
    etype:req.body.emptype,
    hourlyrate:req.body.hrlyrate,
    totalhour:req.body.totalhr,
    total : parseInt(req.body.hrlyrate) * parseInt(req.body.totalhr),
});
  update.exec(function(err,data){
    if(err) throw err;
    res.redirect("/");
  });
  
});

module.exports = router;
