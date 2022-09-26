/* 
    ** This program manage all the comunication with 
    the database and it's in charge to create, select, 
    update and delete registers. **
*/
const sql = require('mssql');
const dbConfig = require('./../models/db/dbConfig');
const event = require('events');
const moment = require('moment');
const delay = require('delay');
var machinesData = require('./machinesData');

var emitter = new event();

async function main () {
    await delay(1000);

    /* Check if there are some registers created corresponding
        to today, if not, proceed to creat them. -> */
        let newRegistersCreated = false;

        if (getActualShift() == 1) {
            if ((await SELECT(`SELECT * FROM CounterShift WHERE creationDoy = ${moment().dayOfYear()} AND creationShift = 1`)).rowsAffected[0] == 0) {
                console.log('Creating new registers');
                createNewRegisters();
                emitter.emit('creatingNewRegisters');
                newRegistersCreated = true;                
            }
        } else if (getActualShift() == 2) {
            if ((await SELECT(`SELECT * FROM CounterShift WHERE ((creationDoy = ${moment().dayOfYear()} AND creationShift = 2) OR (creationDoy = ${moment().dayOfYear() - 1} AND creationShift = 2))`)).rowsAffected[0] == 0){
                console.log('Creating new registers');
                createNewRegisters();
                emitter.emit('creatingNewRegisters');
                newRegistersCreated = true;
            }
        }

        if (!newRegistersCreated) {emitter.emit('Initialized')}
    /* <------------------------------------------- */
    let lastShift = getActualShift();   //Set the lastShift as the actual work shift to be able to detect when this workshift finish. 

    while (true) {
        // If the change of the work shift arrived, proceed to create new registers.
        if (lastShift != getActualShift() ){
            console.log('Creating new registers');
            createNewRegisters();
            emitter.emit('creatingNewRegisters');

            //Set the lastShift as the actual work shift to be able to detect when this workshift finish.
            lastShift = getActualShift();   

        } else {    // While the work shift doesn't change, the registers only will be updated.
            for (let i = 1; i < 8 ; i++){
                let lastUpdateDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
                lastUpdateDateTime = `CONVERT(datetime,'${lastUpdateDateTime}',120)`;

                let machine = machinesData().switchMachine(i); //switchMachine function returns the object with the data of each machine.
                
                //Wait until the update of the registers have been completed.
                if (getActualShift() == 1 ) {
                    await UPDATE(`UPDATE CounterShift SET idMachine = ${machine.idMachine}, inputA = ${machine.shiftCounter.inputA}, inputB = ${machine.shiftCounter.inputB}, output = ${machine.shiftCounter.output}, rejections = ${machine.shiftCounter.rejected}, machineOn = ${machine.timeWorking.machineOn}, machineOff = ${machine.timeWorking.machineOff}, lastUpdateDateTime = ${lastUpdateDateTime} WHERE idMachine = ${i} AND creationDoy = ${moment().dayOfYear()} AND creationShift = 1`);
                    
                } else if (getActualShift() == 2) {
                    await UPDATE(`UPDATE CounterShift SET idMachine = ${machine.idMachine}, inputA = ${machine.shiftCounter.inputA}, inputB = ${machine.shiftCounter.inputB}, output = ${machine.shiftCounter.output}, rejections = ${machine.shiftCounter.rejected}, machineOn = ${machine.timeWorking.machineOn}, machineOff = ${machine.timeWorking.machineOff}, lastUpdateDateTime = ${lastUpdateDateTime} WHERE idMachine = ${i} AND ((creationDoy = ${moment().dayOfYear()} AND creationShift = 2) OR (creationDoy = ${moment().dayOfYear() - 1} AND creationShift = 2))`);
                }
            }
            //console.log('Registers Updated Succesfully', contador++);
        } 

        await pause(1000);  //Do a pause of one second.
    }

}

main();

/* Function to create new Registers ----------> */
    async function createNewRegisters () {
        let creationShift = getActualShift();                               // Set the Shift of the register.
        let creationDayOfYear = moment().dayOfYear();                       // Set the dayOfYear of the register.
        let creationDateTime = moment().format('YYYY-MM-DD HH:mm:ss');      // Set the DateTime of the register.
        creationDateTime = `CONVERT(datetime,'${creationDateTime}',120)`;
        
        /*  Create one register for each machine  */
        for (let i = 1; i < 8 ; i++) {
            let lastUpdateDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
            lastUpdateDateTime = `CONVERT(datetime,'${lastUpdateDateTime}',120)`;
        
            let machine = machinesData().switchMachine(i); //switchMachine function returns the object with the data of each machine.
        
            // Wait until the new register have been created succesfully
            await INSERT(`INSERT INTO CounterShift (idMachine, inputA, inputB, output, rejections, machineOn, machineOff, creationShift, creationDoy, creationDateTime, lastUpdateDateTime) VALUES (${machine.idMachine}, 0, 0, 0, 0, 0, 0, ${creationShift}, ${creationDayOfYear}, ${creationDateTime}, ${lastUpdateDateTime})`);          
        }
    }
/* <------------------------------------------- */


/* This function returns the actual shift ----> */
    function getActualShift () {
        let now = moment();
        let firstShift = moment('07:00:00', 'HH:mm:ss');
        let secondShift = moment('19:00:00', 'HH:mm:ss');
        if (now.isBetween(firstShift, secondShift)) {return 1;} else {return 2}
        /* 
            return 1 -> First shift.
            return 2 -> Second shift.
        */
    }
/* <------------------------------------------- */

/* This function insert new registers to the database ->*/
    async function INSERT (query) {
        const pool1 = new sql.ConnectionPool(dbConfig);
        const pool1Connect = pool1.connect();
        pool1.on('error', err => {
            //emitter.emit('errorLog', {
            //    info : 'Error | Connection Failed Pool1 |',
            //    code: err
            //});
        })

        //console.log(query);

        try {
            await pool1Connect; // ensures that the pool has been created
            let request = await pool1.request(); // or: new sql.Request(pool1)
            await request.query(query);
        } catch (err) {
            console.error('SQL error: ERROR INSERTING NEW REGSTERS', err);
            //emitter.emit('errorLog', {
            //    info : 'Error | Inserting new registers Pool1 |',
            //    code: err 
            //});
        } 
    }
/* <------------------------------------------- */

/* This function update registers from the database ->*/
    async function UPDATE (query) {
        const pool2 = new sql.ConnectionPool(dbConfig);
        const pool2Connect = pool2.connect();
        pool2.on('error', err => {
            //emitter.emit('errorLog', {
            //    info : 'Error | Connection Failed Pool2 |',
            //    code: err
            //});
        })

        // console.log(query);

        try {
            await pool2Connect; // ensures that the pool has been created
            const request = await pool2.request(); // or: new sql.Request(pool2)
            await request.query(query)
        } catch (err) {
            console.error('SQL error: ERROR UPDATING REGISTERS', err);
            //emitter.emit('errorLog', {
            //    info : 'Error | Updating new registers Pool2 |',
            //    code: err 
            //});
        }
    }
/* <------------------------------------------- */

/* This function select registers from the database ->*/
    async function SELECT(query) {
        const pool5 = new sql.ConnectionPool(dbConfig);
        const pool5Connect = pool5.connect();
        pool5.on('error', err => {
            //emitter.emit('errorLog', {
            //    info : 'Error | Connection Failed Pool5 |',
            //    code: err
            //});
        })

        //console.log(query);

        try {
            await pool5Connect; // ensures that the pool has been created
            const request = await pool5.request(); // or: new sql.Request(pool5)
            const result = await request.query(query);
            return result;
        } catch (err) {
            console.error('SQL error: ERROR SELECTING REGISTERS', err);
            //emitter.emit('errorLog', {
            //    info : 'Error | Selecting new registers Pool5 |',
            //    code: err 
            //});
        }
    }
/* <------------------------------------------- */

/* This function pause the program for the time specified -> */
    async function pause (ms){
        await delay(ms);
    }
/* <------------------------------------------- */

module.exports.INSERT = async function (query) {
    const pool3 = new sql.ConnectionPool(dbConfig);
    const pool3Connect = pool3.connect();
    pool3.on('error', err => {
        //emitter.emit('errorLog', {
        //    info : 'Error | Connection Failed Pool3 |',
        //    code: err
        //});
    })

    //console.log(query);

    try {
        await pool3Connect; // ensures that the pool has been created
    	let request = await pool3.request(); // or: new sql.Request(pool3)
        await request.query(query);
    } catch (err) {
        console.error('SQL error', err);
        //emitter.emit('errorLog', {
        //    info : 'Error | Inserting new registers Pool3 |',
        //    code: err 
        //});    
    }
}

module.exports.UPDATE = async function (query) {
    const pool4 = new sql.ConnectionPool(dbConfig);
    const pool4Connect = pool4.connect();
    pool4.on('error', err => {
        //emitter.emit('errorLog', {
        //    info : 'Error | Connection Failed Pool4 |',
        //    code: err
        //});
    })

    console.log(query);

    try {
        await pool4Connect; // ensures that the pool has been created
    	let request = await pool4.request(); // or: new sql.Request(pool4)
        await request.query(query);
    } catch (err) {
        console.error('SQL error', err);
        //emitter.emit('errorLog', {
        //    info : 'Error | Updating new registers Pool4 |',
        //    code: err 
        //});
    }
}

module.exports.SELECT = async function (query) {
    const pool6 = new sql.ConnectionPool(dbConfig);
    const pool6Connect = pool6.connect();
    pool6.on('error', err => {
        //emitter.emit('errorLog', {
        //    info : 'Error | Connection Failed Pool6 |',
        //    code: err
        //});
    })

    // console.log(query);

    try {
        await pool6Connect; // ensures that the pool has been created
    	let request = await pool6.request(); // or: new sql.Request(pool5)
        let result = await request.query(query);
        return result;
    } catch (err) {
        console.error('SQL error', err);
        //emitter.emit('errorLog', {
        //    info : 'Error | Selecting new registers Pool6 |',
        //    code: err 
        //});
    }
}

module.exports.event = {
    emitter
}


