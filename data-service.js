const server = require("./server.js");
const Sequelize = require('sequelize');

var fs = require("fs");

var sequelize = new Sequelize('d48muv3hphc1l1', 'aethwxajhjiyly', 'ab164f21b04638a66a6c740a904a9e918f88a57338b861d01376b27100cf42b1', {
    host: 'ec2-34-224-239-147.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "project_id" as a primary key
        autoIncrement: true // automatically increment the value
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

const Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "project_id" as a primary key
        autoIncrement: true // automatically increment the value
    },
    departmentName: Sequelize.STRING
});

Department.hasMany(Employee, { foreignKey: 'department' });

function initialize() {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(() => {
            resolve();
        }).catch(() => {
            reject("unable to sync the database"); //return;
        });
    });
}

function getAllEmployees() {
    return new Promise(function (resolve, reject) {
        Employee.findAll().then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getEmployeesByStatus(status) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { status: status }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getEmployeesByDepartment(department) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { department: department }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getEmployeesByManager(manager) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { employeeManagerNum: manager }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getEmployeeByNum(num) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { employeeNum: num }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getManagers() {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { isManager: true }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function getDepartments() {
    return new Promise(function (resolve, reject) {
        Department.findAll().then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function addEmployee(employeeData) {
    return new Promise(function (resolve, reject) {
        return new Promise(function (resolve, reject) {
            employeeData.isManager = (employeeData.isManager) ? true : false;
            for (i in employeeData) {
                if (employeeData[i] == "") {
                    employeeData[i] = null;
                }
            }
            resolve();
        }).then(() => {
            console.log(employeeData)
            Employee.create(employeeData).then(() => {
                resolve();
            }).catch(() => {
                reject("unable to create employee");
            });
        });
    });
}

function updateEmployee(employeeData) {
    return new Promise(function (resolve, reject) {
        return new Promise(function (resolve, reject) {
            for (i in employeeData) {
                if (employeeData[i] == "") {
                    employeeData[i] = null;
                }
            }
            employeeData.isManager = (employeeData.isManager) ? true : false;
            resolve();
        }).then(() => {
            Employee.update({
                employeeNum: employeeData.employeeNum,
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                email: employeeData.email,
                SSN: employeeData.SSN,
                addressStreet: employeeData.addressStreet,
                addressCity: employeeData.addressCity,
                addressState: employeeData.addressState,
                addressPostal: employeeData.addressPostal,
                maritalStatus: employeeData.maritalStatus,
                isManager: employeeData.isManager,
                employeeManagerNum: employeeData.employeeManagerNum,
                status: employeeData.status,
                department: employeeData.department,
                hireDate: employeeData.hireDate
            }, {
                where: { employeeNum: employeeData.employeeNum }
            }).then(() => {
                console.log(employeeData);
                resolve()
            }).catch(() => {
                reject("unable to update employee");
            });
        });
    });
}

function deleteEmployeeByNum(empNum) {
    return new Promise(function (resolve, reject) {
        Employee.destroy({
            where: { employeeNum: empNum }
        }).then(() => {
            console.log("successsfully removed employee: ", empNum);
            resolve();
        }).catch((err) => {
            console.log(err);
            reject("unable to delete employee");
        });
    });
}

function addDepartment(departmentData) {
    return new Promise(function (resolve, reject) {
        if (departmentData.departmentName == "") {
            departmentData.departmentName = NULL;
        }
        Department.create(departmentData)
            .then((data) => {
                resolve(data);
            }).catch(() => {
                reject("unable to create department");
            });
    });
}

function updateDepartment(departmentData) {
    return new Promise(function (resolve, reject) {
        for (const i in departmentData) {
            if (i == "") {
                i = NULL;
            }
        }
        Department.update({
            departmentId: departmentData.departmentId,
            departmentName: departmentData.departmentName
        }, {
            where: { departmentId: departmentData.departmentId }
        }).then(() => {
            console.log("successfully updated department: " + departmentData.departmentId);
            resolve()
        }).catch(() => {
            reject("unable to update department");
        });
    });
}

function getDepartmentById(id) {
    return new Promise(function (resolve, reject) {
        Department.findOne({
            where: { departmentId: id }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

function deleteDepartmentById(id) {
    return new Promise(function (resolve, reject) {
        Department.destroy({
            where: { departmentId: id }
        }).then(() => {
            console.log("successsfully removed department: ", id);
            resolve();
        }).catch((err) => {
            reject("unable to delete department");
        });
    });
}

module.exports = { fs, Employee, Department, initialize, getAllEmployees, getManagers, getDepartments, addEmployee, getEmployeesByStatus, getEmployeesByDepartment, getEmployeesByManager, getEmployeeByNum, updateEmployee, deleteEmployeeByNum, addDepartment, updateDepartment, getDepartmentById, deleteDepartmentById };
