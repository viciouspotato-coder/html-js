/*********************************************************************************
 *  WEB322 – Assignment 6
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Henry Tao Student ID: 118375203 Date: 12/02/2021
 *
 *  Online (Heroku) URL: https://fast-depths-37289.herokuapp.com/
 *
 ********************************************************************************/

var express = require("express");
var multer = require('multer');
var app = express();
var path = require("path");
var fs = require("fs");
const clientSessions = require("client-sessions");
const data = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth.js");
const exphbs = require('express-handlebars');

var HTTP_PORT = process.env.PORT || 8080;

const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.engine(".hbs", exphbs({
  extname: ".hbs",
  defaultLayout: 'main',
  helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));
app.set("view engine", ".hbs");

app.use(express.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});

app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "web322_assignment", // this should be a long un-guessable string.
  duration: 10 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 5 * 60 * 1000 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function (req, res) {
  // res.sendFile(path.join(__dirname, "/views/home.html"));
  res.render('home');
});

// setup another route to listen on /about
app.get("/about", function (req, res) {
  res.render('about');
});

app.get("/employees", ensureLogin, function (req, res) {
  if (req.query.status) {
    data.getEmployeesByStatus(req.query.status).then((result) => {
      if (result.length > 0) {
        res.render('employees', { result });
      } else {
        res.render("employees", { message: "no results" });
      }
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  } else if (req.query.department) {
    data.getEmployeesByDepartment(req.query.department).then((result) => {
      if (result.length > 0) {
        res.render('employees', { result });
      } else {
        res.render("employees", { message: "no results" });
      }
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  } else if (req.query.manager) {
    data.getEmployeesByManager(req.query.manager).then((result) => {
      if (result.length > 0) {
        res.render('employees', { result });
      } else {
        res.render("employees", { message: "no results" });
      }
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  } else {
    data.getAllEmployees().then((result) => {
      if (result.length > 0) {
        res.render('employees', { result });
      } else {
        res.render("employees", { message: "no results" });
      }
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  }
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {

  // initialize an empty object to store the values
  let viewData = {};

  data.getEmployeeByNum(req.params.empNum).then((result) => {
    if (result) {
      viewData.employee = result; //store employee data in the "viewData" object as "employee"
    } else {
      viewData.employee = null; // set employee to null if none were returned
    }
  }).catch(() => {
    viewData.employee = null; // set employee to null if there was an error 
  }).then(data.getDepartments)
    .then((result) => {
      viewData.departments = result; // store department data in the "viewData" object as "departments"

      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching 
      // viewData.departments object
      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.employee[0].department) {
          viewData.departments[i].selected = true;
        }
      }
    }).catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
      if (viewData.employee == null) { // if no employee - return an error
        res.status(404).send("Employee Not Found");
      } else {
        res.render("employee", { viewData: viewData }); // render the "employee" view
      }
    });
});



app.get("/employees/add", ensureLogin, function (req, res) {
  data.getDepartments().then((result) => {
    res.render("addEmployee", { departments: result });
  }).catch(() => {
    res.render("addEmployee", { departments: [] });
  })
});

app.post("/employees/add", ensureLogin, function (req, res) {
  data.addEmployee(req.body).then(() => {
    res.redirect("/employees");
  }).catch(() => {
    res.redirect("/employees");
  })
});

app.post("/employee/update", ensureLogin, (req, res) => {
  data.updateEmployee(req.body).then(() => {
    res.redirect("/employees");
  }).catch(() => {
    console.log();
  })
});

app.get(["/employee/delete/:empNum"], ensureLogin, function (req, res) {
  data.deleteEmployeeByNum(req.params.empNum).then(() => {
    res.redirect("/employees");
  }).catch(() => {
    res.status(500).send("Unable to Remove Employee / Employee not found");
  })
});

app.get("/managers", ensureLogin, function (req, res) {
  data.getManagers().then((result) => {
    res.render('managers', { result });
  }).catch(() => {
    res.render("managers", { message: "no results" });
  })
});

app.get("/departments", ensureLogin, function (req, res) {
  data.getDepartments().then((result) => {
    if (result.length > 0) {
      console.log(result);
      res.render('departments', { result });
    } else {
      res.render("departments", { message: "no results" });
    }
  }).catch(() => {
    res.render("departments", { message: "no results" });
  })
});

app.get("/departments/add", ensureLogin, function (req, res) {
  res.render('addDepartment');
});

app.post("/departments/add", ensureLogin, function (req, res) {
  data.addDepartment(req.body).then(() => {
    res.redirect("/departments");
  }).catch(() => {
    res.redirect("/departments");
  })
});

app.post("/department/update", ensureLogin, function (req, res) {
  data.updateDepartment(req.body).then(() => {
    res.redirect("/departments");
  }).catch(() => {
    console.log();
  })
});

app.get(["/department/:departmentId"], ensureLogin, function (req, res) {
  data.getDepartmentById(req.params.departmentId).then((result) => {
    res.render('department', { result });
  }).catch(() => {
    res.status(404).send("Department Not Found");
  })
});

app.get(["/department/delete/:departmentId"], ensureLogin, function (req, res) {
  data.deleteDepartmentById(req.params.departmentId).then((result) => {
    res.redirect("/departments");
  }).catch(() => {
    res.status(500).send("Unable to Remove Department / Department not found");
  })
});

app.get("/images/add", ensureLogin, function (req, res) {
  res.render('addImage');
});

app.post("/images/add", upload.single("imageFile"), ensureLogin, function (req, res) {
  res.redirect("/images");
})

app.get("/images", ensureLogin, function (req, res) {
  fs.readdir("./public/images/uploaded", function (err, files) {
    var image = { "images": files };
    res.render("images", image);
  });

});

app.get("/login", function (req, res) {
  res.render('login');
});

app.post("/login", function (req, res) {
  req.body.userAgent = req.get('User-Agent');
  dataServiceAuth.checkUser(req.body).then((result) => {
    req.session.user = {
      userName: result.userName, // authenticated user's userName
      email: result.email, // authenticated user's email
      loginHistory: result.loginHistory // authenticated user's loginHistory
    }
    res.redirect('/employees');
  }).catch((err) => {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  })
});

app.get("/register", function (req, res) {
  res.render('register');
});

app.post("/register", function (req, res) {
  dataServiceAuth.registerUser(req.body).then(() => {
    res.render('register', { successMessage: "User created" });
  }).catch((err) => {
    res.render('register', { errorMessage: err, userName: req.body.userName });
  })
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, function (req, res) {
  console.log(req.session);
  res.render("userHistory");
});

app.get("*", function (req, res) {
  res.sendFile(__dirname + "/404.html");
});

// setup http server to listen on HTTP_PORT
dataServiceAuth.initialize()
  .then(dataServiceAuth.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT)
    });
  }).catch(function (err) {
    console.log("unable to start server: " + err);
  });
