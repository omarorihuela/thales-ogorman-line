const net = require('net');
const moment = require('moment');
const delay = require('delay');
const event = require('events');

const express = require('express');
const router = express.Router();

// const db = require('./../modules/dbThales');
// const errorLog = require('./../modules/errorLog.js');
// var machinesData = require('./../modules/machinesData');

var clientConnectedCobotUR10 = false;
var clientConnectedScaraIJ01 = false;
var clientConnectedScaraIJ02 = false;
var clientConnectedScaraJM01 = false;
var clientConnectedScaraJM02 = false;

/* Require the modules programs that are in charge of
    the comunication with PLCs ---------------- */
    // const modbusCobot = require('./../modules/modbusCobot');
    // const modbusPLC_cobotUR10 = require('../modules/modbusPLC_cobotUR10');
    // const modbusPLC_IJ01 = require('../modules/modbusPLC_IJ01')
    // const modbusPLC_IJ02 = require('../modules/modbusPLC_IJ02');
    // const modbusPLC_JM01 = require('../modules/modbusPLC_JM01');
    // const modbusPLC_JM02 = require('../modules/modbusPLC_JM02');
/* <------------------------------------------- */

/* Initialice the events  --------------------> */
    const routesEvent = new event();
    // const dbEvent = db.event.emitter;
    // const modbusCobotEvent = modbusCobot.event.emitter;
    // const modbusPLC_cobotUR10Event = modbusPLC_cobotUR10.event.emitter;
    // const modbusPLC_IJ01Event = modbusPLC_IJ01.event.emitter;
    // const modbusPLC_IJ02Event = modbusPLC_IJ02.event.emitter;
    // const modbusPLC_JM01Event = modbusPLC_JM01.event.emitter;
    // const modbusPLC_JM02Event = modbusPLC_JM02.event.emitter;
    // const errorLogEvent = errorLog.event.emitter;
/* <------------------------------------------- */

/* Socket io ---------------------------------> */
    var io;
/* <------------------------------------------- */

/* _machineShiftCounter is an object with all the information
that is going to be showed on the 'Production' Window -----> */
    // const MachineShiftsCounters = require('../models/db/machineShiftsCounters');
    // var _machineShiftsCounters = new MachineShiftsCounters();
/* <------------------------------------------- */

/* Import the object structure of each robot -> */
    const COBOT = require('./../models/robots/cobot');
    const SCARA_IJ = require('./../models/robots/scaraIJ')
    const SCARA_JM = require('./../models/robots/scaraJM')
/* <------------------------------------------- */

/* Initialice the _cobotUR10 object and each one of the
    scara Robots -----------------------------> */
    var _cobotUR10 = new COBOT('cobotUR10');
    var _scaraIJ01 = new SCARA_IJ('scara01');
    var _scaraIJ02 = new SCARA_IJ('scaraIJ02');
    var _scaraJM01 = new SCARA_JM('scaraJM01');
    var _scaraJM02 = new SCARA_JM('scaraJM02');
/* <------------------------------------------- */


/* Handle Errors -----------------------------> */
    // dbEvent.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusCobotEvent.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusPLC_cobotUR10Event.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusPLC_IJ01Event.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusPLC_IJ02Event.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusPLC_JM01Event.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
    // modbusPLC_JM02Event.on('errorLog', function(err) {errorLogEvent.emit('errorLog', err)});
/* <------------------------------------------- */

/* Open Scara Sockets ------------------------> */
    var socketWritingICI01;
    var socketReadingICI01;
    var socketWritingICI02;
    var socketReadingICI02;
    var socketWritingJinguan01;
    var socketReadingJinguan01;
    var socketWritingJinguan02;
    var socketReadingJinguan02;

    routesEvent.on('clientConnectedScaraIJ01', function() {
        socketWritingICI01.listen(3003, '192.168.40.100', function() {
            console.log("Server listening on port: 3003");
        });
        socketReadingICI01.listen(3004, '192.168.40.100', function() {
            console.log("Server listening on port: 3004");
        });
    });

    routesEvent.on('clientConnectedScaraIJ02', function() {
        socketWritingICI02.listen(3007, '192.168.40.100', function() {
            console.log("Server listening on port: 3007");
        });
        socketReadingICI02.listen(3008, '192.168.40.100', function() {
            console.log("Server listening on port: 3008");
        });

    });

    routesEvent.on('clientConnectedScaraJM01', function() {
        socketWritingJinguan01.listen(3001, '192.168.40.100', function() {
            console.log("Server listening on port: 3001");
        });
        socketReadingJinguan01.listen(3002, '192.168.40.100', function() {
            console.log("Server listening on port: 3002");
        });

    });

    routesEvent.on('clientConnectedScaraJM02', function() {
        socketWritingJinguan02.listen(3009, '192.168.40.100', function() {
            console.log("Server listening on port: 3009");
        });
        socketReadingJinguan02.listen(3010, '192.168.40.100', function() {
            console.log("Server listening on port: 3010");
        });

    });
/* <------------------------------------------- */

/* Events from the database program ----------> */

    var dbInitialized = false;

    //This event notify us that new registers have been created
    // and then we proceed to reset the Shift Counters
    // dbEvent.on('creatingNewRegisters', async function() {
    //     dbInitialized = false;
    //     resetShiftCardsCountersFunction(true);
    //     await delay(1000);
    //     resetShiftCardsCountersFunction(false);
    //     console.log('Shift Counters Reseted');
    //     dbEvent.emit('Initialized');
    // });

    // dbEvent.on('Initialized' , async function (){
    //     console.log('Database Initialized');
    //     for (let i = 1; i < 8 ; i++) {
    //         let machine = switchMachine(i);
    //         let result = await db.SELECT(`SELECT TOP 3 * FROM CounterShift WHERE idMachine = ${i} ORDER BY creationDateTime DESC`);
    //         if (result.rowsAffected != 0 ){
    //             if (machine == 'Metronic') {modbusPLC_cobotUR10('timeWorking', [result.recordset[0].machineOn, result.recordset[0].machineOff])}            
    //             if (machine == 'ICI01'){modbusPLC_IJ01('timeWorking', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //             if (machine == 'ICI02'){modbusPLC_IJ02('timeWorking', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //             if (machine == 'Jinguan01'){modbusPLC_JM01('timeWorkingJinguan', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //             if (machine == 'Jinguan02'){modbusPLC_JM02('timeWorkingJinguan', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //             if (machine == 'MPR01'){modbusPLC_JM01('timeWorkingMPR', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //             if (machine == 'MPR02'){modbusPLC_JM02('timeWorkingMPR', [result.recordset[0].machineOn, result.recordset[0].machineOff])}
    //         }
    //     }
    //     dbInitialized = true;
    // });
/* <------------------------------------------- */

/* Events from the modbus Cobot --------------> */
    // modbusCobotEvent.on('protectiveStop', (value) => {
    //     value == 1 ? modbusPLC_cobotUR10('protectiveStop', true) : modbusPLC_cobotUR10('protectiveStop', false);
    // });
    // modbusCobotEvent.on('emergencyStop', (value) => {
    //     value == 1 ? modbusPLC_cobotUR10('emergencyStop', true) : modbusPLC_cobotUR10('emergencyStop', false);
    // });
    // modbusCobotEvent.on('endChangeFormat', () => {
    //     _cobotUR10.control.general.changeFormat = '0';
    //     _cobotUR10.control.process.stateICI01 = '0';
    //     io.emit('endChangeFormat');
    // });
    // modbusCobotEvent.on('bufferReseted', () => {
    //     _cobotUR10.production.cobotBuffer.resetBuffer = '0';
    // });
/* <------------------------------------------- */

async function main () {
            
    /* This function execute the functions that manage the 
    information between each PLC and each object that is 
    going to be sended to the frontend -----------> */
        async function startPLCPrograms() {
            while (true) {

                if (clientConnectedCobotUR10) manageDataModbusCobot();
                manageDataModbusPLC_cobotUR10();
                manageDataModbusPLC_IJ01();
                manageDataModbusPLC_IJ02();
                manageDataModbusPLC_JM01();
                manageDataModbusPLC_JM02();
                manageDataFromMachines();
                
                if (dbInitialized == true) {
                    await getDataFromShiftsCounters();
                }

                await delay(100);
            }
        }
        // startPLCPrograms();
    /* <------------------------------------------- */

    /* Render the view of each window ------------> */
        router.get('/', (req, res) => {
            res.render('index');
        })
        router.get('/cobotUR10', (req, res) => {
            res.render('cobotUR10', {dataCobot: JSON.stringify(_cobotUR10)});
        })
        router.get('/scara01', (req, res) => {
            res.render('scara01', {dataScara: JSON.stringify(_scaraIJ01)});
        })
        router.get('/scaraIJ02', (req, res) => {
            res.render('scaraIJ02', {dataScara: JSON.stringify(_scaraIJ02)});
        })
        router.get('/scaraJM01', (req, res) => {
            res.render('scaraJM01', {dataScara: JSON.stringify(_scaraJM01)});
        })
        router.get('/scaraJM02', (req, res) => {
            res.render('scaraJM02', {dataScara: JSON.stringify(_scaraJM02)});
        })
        router.get('/Production', (req, res) => {
            res.render('Production', {dataProduction: JSON.stringify(_machineShiftsCounters)});
        })    
        router.get('/Demo', (req, res) => {
            res.render('Demo');
        })
    /* <------------------------------------------- */
    
    /* Client connected --------------------------> */
        // router.post('/clientConnected/:id', (req, res) => {
        //     let {id} = req.params;
        //     console.log(req.body);
        //     let browserOperationMode = req.body;
        //     if (id == 'cobotUR10'){
        //         if (!clientConnectedCobotUR10) {
    
        //             _cobotUR10.control.process.stateMetronic = browserOperationMode.stateMetronic;
        //             _cobotUR10.control.process.stateBuffer = browserOperationMode.stateBuffer;
        //             _cobotUR10.control.process.stateICI01 = browserOperationMode.stateICI01;
        //             _cobotUR10.control.process.stateICI02 = browserOperationMode.stateICI02;
    
        //             routesEvent.emit('clientConnectedCobotUR10');
                    
        //             clientConnectedCobotUR10 = true;
        //         }
        //     } else if (id == 'scara01'){
        //         if (!clientConnectedScaraIJ01) {
    
        //             _scaraIJ01.control.process.stateICI = browserOperationMode.stateICI;
        //             _scaraIJ01.control.process.stateBuffer = browserOperationMode.stateBuffer;
        //             _scaraIJ01.control.process.stateJinguan = browserOperationMode.stateJinguan;
    
        //             clientConnectedScaraIJ01 = true;

        //             routesEvent.emit('clientConnectedScaraIJ01');
        //         }
        //     } else if (id == 'scaraIJ02'){
        //         if (!clientConnectedScaraIJ02) {

        //             _scaraIJ02.control.process.stateICI = browserOperationMode.stateICI;
        //             _scaraIJ02.control.process.stateBuffer = browserOperationMode.stateBuffer;
        //             _scaraIJ02.control.process.stateJinguan = browserOperationMode.stateJinguan;
    
        //             clientConnectedScaraIJ02 = true;

        //             routesEvent.emit('clientConnectedScaraIJ02');
        //         }
        //     } else if (id == 'scaraJM01'){
        //         if (!clientConnectedScaraJM01) {
    
        //             _scaraJM01.control.process.stateJinguan = browserOperationMode.stateJinguan;
        //             _scaraJM01.control.process.stateBuffer = browserOperationMode.stateBuffer;
        //             _scaraJM01.control.process.stateMPR = browserOperationMode.stateMPR;
    
        //             clientConnectedScaraJM01 = true;

        //             routesEvent.emit('clientConnectedScaraJM01');
        //         }
        //     } else if (id == 'scaraJM02'){
        //         if (!clientConnectedScaraJM02) {
    
        //             _scaraJM02.control.process.stateJinguan = browserOperationMode.stateJinguan;
        //             _scaraJM02.control.process.stateBuffer = browserOperationMode.stateBuffer;
        //             _scaraJM02.control.process.stateMPR = browserOperationMode.stateMPR;
    
        //             clientConnectedScaraJM02 = true;

        //             routesEvent.emit('clientConnectedScaraJM02');
        //         }
        //     }
        //     res.end();
        // })
    /* <------------------------------------------- */

    /* Manage band operation ---------------------> */
        // router.post('/bandStartStop', (req, res) => {
        //     let data = req.body;

        //     console.log('Data from client => bandStartStop : ', data); 
        //     if (data.bandStatus == '1') {
        //         _cobotUR10.bandMetronic.start = true;
        //         _cobotUR10.bandMetronic.pause = true;
        //         _cobotUR10.bandMetronic.reset = false;
        //         modbusPLC_cobotUR10('bandStart', _cobotUR10.bandMetronic.start);
        //     } else if (data.bandStatus == '0') {
        //         _cobotUR10.bandMetronic.start = false;
        //         _cobotUR10.bandMetronic.pause = false;
        //         _cobotUR10.bandMetronic.reset = false;
        //         modbusPLC_cobotUR10('bandStop', _cobotUR10.bandMetronic.stop);
        //     }

        //     res.end();
        // });

        // router.post('/bandReset', (req, res) => {
        //     let data = req.body;
        //     console.log('Data from client => bandReset : ', data); 
            
        //     _cobotUR10.bandMetronic.reset = true;
        //     _cobotUR10.bandMetronic.pause = false;

        //     modbusPLC_cobotUR10('bandReset', _cobotUR10.bandMetronic.reset);

        //     res.end();
        // });
    /* <------------------------------------------- */

    /* Reset Cards Counter -----------------------> */
        // router.post('/resetLotCardsCounters', async function (req, res) {
        //     let data = req.body;
        
        //     console.log('Data from client => resetLotCounterCards : ', data); 

        //     let creationDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        //     creationDateTime = `CONVERT(datetime,'${creationDateTime}',120)`;
        //     let lastUpdateDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        //     lastUpdateDateTime = `CONVERT(datetime,'${lastUpdateDateTime}',120)`;
        //     for (let i = 1 ; i < 8 ; i++){
        //         console.log('setValues: ', machinesData().switchMachine(i));
        //         let machine = machinesData().switchMachine(i);
        //         await (db.INSERT(`INSERT INTO CounterLot (idMachine, inputA, inputB, output, rejections, creationDateTime, lastUpdateDateTime) VALUES (${i}, 0, 0, 0, 0, ${creationDateTime}, ${lastUpdateDateTime})`));

        //     }
        //     resetLotCardsCountersFunction(true);
        //     await delay(1000); 
        //     resetLotCardsCountersFunction(false);
        //     res.end();
        // })
    /* <------------------------------------------- */

    /* Routes to send data to each window --------> */
        // router.get('/:id/Production/getData', (req, res) => {
        //     let {id} = req.params;
        //     if ( id == 'cobotUR10'){
        //         clientConnectedCobotUR10 ? res.json(_cobotUR10) : res.send('ClientDisconnected');
        //     } else if ( id == 'scara01' ) {
        //         clientConnectedScaraIJ01 ? res.json(_scaraIJ01) : res.send('ClientDisconnected');
        //     } else if ( id == 'scaraIJ02' ) {
        //         clientConnectedScaraIJ02 ? res.json(_scaraIJ02) : res.send('ClientDisconnected');
        //     } else if ( id == 'scaraJM01' ) {
        //         clientConnectedScaraJM01 ? res.json(_scaraJM01) : res.send('ClientDisconnected');
        //     } else if ( id == 'scaraJM02' ) {
        //         clientConnectedScaraJM02 ? res.json(_scaraJM02) : res.send('ClientDisconnected');
        //     }
        //     //console.log('Data sended');
        //     res.end();
        // });
        // router.get('/index/getData',async (req,res) => {
        //     let _Metronic = await machinesData().switchMachine(1);
        //     let _ICI01 = await machinesData().switchMachine(2);
        //     let _Jinguan01 = await machinesData().switchMachine(3);
        //     let _MPR01 = await machinesData().switchMachine(4);
        //     let _ICI02 =  await machinesData().switchMachine(5);
        //     let _Jinguan02 = await machinesData().switchMachine(6);
        //     let _MPR02 = await machinesData().switchMachine(7);
        //     let data = {
        //         _Metronic,
        //         _ICI01,
        //         _Jinguan01,
        //         _MPR01,
        //         _ICI02,
        //         _Jinguan02,
        //         _MPR02
        //     }
        //     // console.log(data);
        //     res.json(data);
        //     res.end();
        // })
        // router.get('/production/getData', (req, res) => {
        //     res.json(_machineShiftsCounters);
        // });
    /* <------------------------------------------- */

    /* Routes of the 'Produccion' section --------> */
        // router.post('/:id/Production/resetBuffer', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;
        
        //     console.log('Id: ', id);
        //     console.log('Data from client => resetBuffer', data);
        
        //     if ( id == 'cobotUR10') {
        //         _cobotUR10.production.cobotBuffer.resetBuffer = data.resetBuffer;
        //     } else if ( id == 'scara01' ) {
        //         _scaraIJ01.production.bufferScara.resetBuffer = data.resetBuffer;
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.production.bufferScara.resetBuffer = data.resetBuffer;
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.production.bufferScara.resetBuffer = data.resetBuffer;
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.production.bufferScara.resetBuffer = data.resetBuffer;
        //     }
            
        //     res.end()
        // })
    /* <------------------------------------------- */
        
    /* Routes of 'Control' section ---------------> */
        // router.post('/:id/Control/setPointCards', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => setPointCards ', data);

        //     if ( id == 'cobotUR10') {
        //         _cobotUR10.control.general.setPointCards = data.setPointCards;
        //         modbusPLC_cobotUR10('setPointCards', data.setPointCards);
        //     } else if ( id == 'scara01' ) {
        //         _scaraIJ01.control.general.setPointCards = data.setPointCards;
        //         modbusPLC_IJ01('setPointCards', data.setPointCards);
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.general.setPointCards = data.setPointCards;
        //         modbusPLC_IJ02('setPointCards', data.setPointCards);
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.general.setPointCards = data.setPointCards;
        //         modbusPLC_JM01('setPointCards', data.setPointCards);
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.general.setPointCards = data.setPointCards;
        //         modbusPLC_JM02('setPointCards', data.setPointCards);
        //     }
        //     res.end();
        // })

        //Only the _cobotUR10 have the option to changeFormat
        // router.post('/cobotUR10/Control/changeFormat', (req, res) => {
        //     let data = req.body;
        //     console.log('Data from client => changeFormat: ', data);

        //     _cobotUR10.control.general.changeFormat = data.changeFormat;
        //     res.end(); 

        //     _cobotUR10.control.process.stateICI02 = '0';

        // })

        /* Only the scara robots have the option to set a delay
            to raise after take the cards from the card container */
        // router.post('/:id/Control/delayRobotUp', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => delayRobotUp: ', data);

        //     if ( id == 'scara01' ) {
        //         _scaraIJ01.control.general.delayRobotUp = data.delayRobotUp;
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.general.delayRobotUp = data.delayRobotUp;
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.general.delayRobotUp = data.delayRobotUp;
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.general.delayRobotUp = data.delayRobotUp;
        //     }
            
        //     res.end()
        // })

        // router.post('/:id/Control/operationMode', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => operationMode:  ', data);

        //     if ( id == 'cobotUR10') {
        //         _cobotUR10.control.process.stateMetronic = data.stateMetronic;
        //         _cobotUR10.control.process.stateBuffer = data.stateBuffer;
        //         _cobotUR10.control.process.stateICI01 = data.stateICI01;
        //         _cobotUR10.control.process.stateICI02 = data.stateICI02;
        //     } else if ( id == 'scara01' ) {
        //         _scaraIJ01.control.process.stateICI = data.stateICI;
        //         _scaraIJ01.control.process.stateBuffer = data.stateBuffer;
        //         _scaraIJ01.control.process.stateJinguan = data.stateJinguan;
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.process.stateICI = data.stateICI;
        //         _scaraIJ02.control.process.stateBuffer = data.stateBuffer;
        //         _scaraIJ02.control.process.stateJinguan = data.stateJinguan;
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.process.stateJinguan = data.stateJinguan;
        //         _scaraJM01.control.process.stateBuffer = data.stateBuffer;
        //         _scaraJM01.control.process.stateMPR = data.stateMPR;
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.process.stateJinguan = data.stateJinguan;
        //         _scaraJM02.control.process.stateBuffer = data.stateBuffer;
        //         _scaraJM02.control.process.stateMPR = data.stateMPR;
        //     }
        //     res.end()
        // })
        // router.post('/:id/Control/takeCards', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => takeCards ', data);

        //     if ( id == 'scara01' ) {
        //         _scaraIJ01.control.process.takeCards = data.takeCards;
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.process.takeCards = data.takeCards;
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.process.takeCards = data.takeCards;
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.process.takeCards = data.takeCards;
        //     }
        //     res.end();
        // })
        // router.post('/:id/Control/openGripper', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => openGripper ', data);
        //     if(data.openGripper == '1'){data.openGripper = true};
        //     if(data.openGripper == '0'){data.openGripper = false};


        //     if ( id == 'cobotUR10') {
        //         _cobotUR10.control.process.openGripper = data.openGripper;
        //         modbusPLC_cobotUR10('openGripper', data.openGripper);
        //     } else if ( id == 'scara01' ) {
        //         _scaraIJ01.control.process.openGripper = data.openGripper;
        //         modbusPLC_IJ01('openGripper', data.openGripper);
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.process.openGripper = data.openGripper;
        //         modbusPLC_IJ02('openGripper', data.openGripper);
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.process.openGripper = data.openGripper;
        //         modbusPLC_JM01('openGripper', data.openGripper);
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.process.openGripper = data.openGripper;
        //         modbusPLC_JM02('openGripper', data.openGripper);
        //     }
        //     res.end();
        // })
        // router.post('/:id/Control/generalReset', (req, res) => {
        //     let {id} = req.params;
        //     let data = req.body;

        //     console.log('Id: ', id);
        //     console.log('Data from client => generalReset ', data);

        //     if ( id == 'cobotUR10') {
        //         _cobotUR10.control.process.generalReset = data.generalReset;
        //     } else if ( id == 'scara01' ) {
        //         _scaraIJ01.control.process.generalReset = data.generalReset;
        //     } else if ( id == 'scaraIJ02' ) {
        //         _scaraIJ02.control.process.generalReset = data.generalReset;
        //     } else if ( id == 'scaraJM01' ) {
        //         _scaraJM01.control.process.generalReset = data.generalReset;
        //     } else if ( id == 'scaraJM02' ) {
        //         _scaraJM02.control.process.generalReset = data.generalReset;
        //     }
        //     res.end();
        // })
    /* <------------------------------------------- */

    /*  Writing sockets SCARA --------------------> */
        socketWritingJinguan01 = net.createServer(function(socket) {
            console.log('Writing Socket : Jinguan - MPR 01 : connected');
            socket.on('data', (data) => {
                try {
                    //console.log('Data 3001: ', data.toString());
                    if (data == "Send me values") {
                        socket.write(`${_scaraJM01.production.bufferScara.resetBuffer}, ${_scaraJM01.control.general.setPointCards}, 
                        ${_scaraJM01.control.general.delayRobotUp}, ${_scaraJM01.control.process.stateJinguan}, 
                        ${_scaraJM01.control.process.stateBuffer}, ${_scaraJM01.control.process.stateMPR}, 
                        ${_scaraJM01.control.process.takeCards}\r`);
                    }
                    if (data == "Buffer restarted") {
                        console.log('Buffer restarted');
                        _scaraJM01.production.bufferScara.resetBuffer = '0';
                    }
                    if (data == "Force take cards applied") {
                        console.log('Force take cards applied');
                        _scaraJM01.control.process.takeCards = '0';
                    }
                } catch (err) {
                    console.log('Error on Socket Writing Jinguan 01 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Writing Jinguan 01 |',
                        code: err
                    });
                }
            });   
            socket.pipe(socket);
            socket.on('error', function(err) {
                console.log('Error on Socket Writing Jinguan 01 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Writing Jinguan 01 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketWritingJinguan01.close();
                socketWritingJinguan01.listen(3001, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Writing Jinguan 01 |',
                        code: 'socketWritingJinguan01 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        });
        socketWritingICI01 = net.createServer(function(socket) {
            console.log('Writing Socket :  ICI - Jinguan 01 : connected');
            socket.on('data', (data) => {
                try {
                    //console.log('Data 3001: ', data.toString());
                    if (data == "Send me values") {
                        socket.write(`${_scaraIJ01.production.bufferScara.resetBuffer}, ${_scaraIJ01.control.general.setPointCards}, 
                        ${_scaraIJ01.control.general.delayRobotUp}, ${_scaraIJ01.control.process.stateICI}, 
                        ${_scaraIJ01.control.process.stateBuffer}, ${_scaraIJ01.control.process.stateJinguan}, 
                        ${_scaraIJ01.control.process.takeCards}\r`);
                    }
                    if (data == "Buffer restarted") {
                        console.log('Buffer restarted');
                        _scaraIJ01.production.bufferScara.resetBuffer = '0';
                    }
                    if (data == "Force take cards applied") {
                        console.log('Force take cards applied');
                        _scaraIJ01.control.process.takeCards = '0';
                    }
                } catch (err) {
                    console.log('Error on Socket Writing ICI 01 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Writing ICI 01 |',
                        code: err
                    });
                }
            });    
            socket.pipe(socket);            
            socket.on('error', function(err) {
                console.log('Error on Socket Writing ICI 01 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Writing ICI 01 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketWritingICI01.close();
                socketWritingICI01.listen(3003, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Writing ICI 01 |',
                        code: 'socketWritingICI01 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
        socketWritingICI02 = net.createServer(function(socket) {
            console.log('Writing Socket : ICI - Jinguan 02 : connected');
            socket.on('data', (data) => {
                try {
                    //console.log('Data 3001: ', data.toString());
                    if (data == "Send me values") {

                        socket.write(`${_scaraIJ02.production.bufferScara.resetBuffer}, ${_scaraIJ02.control.general.setPointCards}, 
                        ${_scaraIJ02.control.general.delayRobotUp}, ${_scaraIJ02.control.process.stateICI}, 
                        ${_scaraIJ02.control.process.stateBuffer}, ${_scaraIJ02.control.process.stateJinguan}, 
                        ${_scaraIJ02.control.process.takeCards}\r`);

                    }
                    if (data == "Buffer restarted") {
                        console.log('Buffer restarted');
                        _scaraIJ02.production.bufferScara.resetBuffer = '0';
                    }
                    if (data == "Force take cards applied") {
                        console.log('Force take cards applied');
                        _scaraIJ02.control.process.takeCards = '0';
                    }
                } catch (err) {
                    console.log('Error on Socket Writing ICI 02 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Writing ICI 02 |',
                        code: err
                    });
                }
            })    
            socket.pipe(socket);            
            socket.on('error', function(err) {
                console.log('Error on Socket Writing ICI 02 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Writing ICI 02 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketWritingICI02.close();
                socketWritingICI02.listen(3007, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Writing ICI 02 |',
                        code: 'socketWritingICI02 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
        socketWritingJinguan02 = net.createServer(function(socket) {
            console.log('writing Socket : Jinguan - MPR 02 : connected');
            socket.on('data', (data) => {
                try {
                    //console.log('Data 3001: ', data.toString());
                    if (data == "Send me values") {

                        socket.write(`${_scaraJM02.production.bufferScara.resetBuffer}, ${_scaraJM02.control.general.setPointCards}, 
                        ${_scaraJM02.control.general.delayRobotUp}, ${_scaraJM02.control.process.stateJinguan}, 
                        ${_scaraJM02.control.process.stateBuffer}, ${_scaraJM02.control.process.stateMPR}, 
                        ${_scaraJM02.control.process.takeCards}\r`);

                    }
                    if (data == "Buffer restarted") {
                        console.log('Buffer restarted');
                        _scaraJM02.production.bufferScara.resetBuffer = '0';
                    }
                    if (data == "Force take cards applied") {
                        console.log('Force take cards applied');
                        _scaraJM02.control.process.takeCards = '0';
                    }
                } catch (err) {
                    console.log('Error on Socket Writing Jinguan 02 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Writing Jinguan 02 |',
                        code: err
                    });
                }
            });    
            socket.pipe(socket);
            socket.on('error', function(err) {
                console.log('Error on Socket Writing Jinguan 02 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Writing Jinguan 02 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketWritingJinguan02.close();
                socketWritingJinguan02.listen(3009, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Writing Jinguan 02 |',
                        code: 'socketWritingJinguan02 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
    /* <------------------------------------------- */

    /*  Reading sockets SCARA --------------------> */
        socketReadingJinguan01 = net.createServer(function(socket) {
            console.log("Reading Socket : Jinguan - MPR 01 : connected");
            let scaraData;

            socket.on('data', (data) => {
                try {
                    scaraData = data.toString();
                    scaraData = scaraData.replace(/#/g,'"');
                    // console.log('Scara: ' , scaraData);
                    scaraData = JSON.parse(scaraData);
                    // console.log('Object: ' , scaraData);
                    _scaraJM01.production.status.robot = scaraData.stRobot;
                    _scaraJM01.production.bufferScara.drawersOccuped = scaraData.ctPosInBuffer;
                } catch (err) {
                    console.log('Error on Socket Reading Jinguan 01 : ', err); 
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Reading Jinguan 01 |',
                        code: err
                    });
                }
            });
            socket.pipe(socket);
            socket.on('error', function(error) {
                console.log('Error on Socket Reading Jinguan 01 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Reading Jinguan 01 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketWritingJinguan01.close();
                socketReadingJinguan01.listen(3002, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Reading Jinguan 01 |',
                        code: 'socketReadingJinguan01 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
        socketReadingICI01 = net.createServer(function(socket) {
            console.log("Reading Socket : ICI - Jinguan 01 : connected");
            let scaraData;

            socket.on('data', (data) => {
                try {
                    scaraData = data.toString();
                    scaraData = scaraData.replace(/#/g,'"');
                    //console.log('Scara: ' , scaraData);
                    scaraData = JSON.parse(scaraData);
                    //console.log('Object: ' , scaraData);
                    _scaraIJ01.production.status.robot = scaraData.stRobot;
                    _scaraIJ01.production.bufferScara.drawersOccuped = scaraData.ctPosInBuffer;
                } catch (err) {
                    console.log('Error on socket Reading ICI 01 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Reading ICI 01 |',
                        code: err
                    });
                }
            });
            socket.pipe(socket);
            socket.on('error', function(err) {
                console.log('Error on socket Reading ICI 01 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Reading ICI 01 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketReadingICI01.close();
                socketReadingICI01.listen(3004, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Reading ICI 01 |',
                        code: 'socketReadingICI01 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
        socketReadingICI02 = net.createServer(function(socket) {
            console.log("Reading Socket : ICI - Jinguan 02 : connected");
            let scaraData;

            socket.on('data', (data) => {
                try {
                    scaraData = data.toString();
                    scaraData = scaraData.replace(/#/g,'"');
                    //console.log('Scara: ' , scaraData);
                    scaraData = JSON.parse(scaraData);
                    //console.log('Object: ' , scaraData);
                    _scaraIJ02.production.status.robot = scaraData.stRobot;
                    _scaraIJ02.production.bufferScara.drawersOccuped = scaraData.ctPosInBuffer;
                } catch (err) {
                    console.log('Error on Socket Reading ICI 02 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Reading ICI 02 |',
                        code: err
                    });
                }
            });
            socket.pipe(socket);
            socket.on('error', function(err) {
                console.log('Error on Socket Reading ICI 02 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Reading ICI 02 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketReadingICI02.close();
                socketReadingICI02.listen(3008, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Reading ICI 02 |',
                        code: 'socketReadingICI02 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
        socketReadingJinguan02 = net.createServer(function(socket) {
            console.log("Reading Socket : Jinguan - MPR 02 : connected");
            let scaraData;

            socket.on('data', (data) => {
                try {
                    scaraData = data.toString();
                    scaraData = scaraData.replace(/#/g,'"');
                    // console.log('Scara: ' , scaraData);
                    scaraData = JSON.parse(scaraData);
                    // console.log('Object: ' , scaraData);
                    _scaraJM02.production.status.robot = scaraData.stRobot;
                    _scaraJM02.production.bufferScara.drawersOccuped = scaraData.ctPosInBuffer;
                } catch (err) {
                    console.log('Error on Socket Reading Jinguan 02 : ', err);
                    errorLogEvent.emit('errorLog', {
                        info: 'Error | socket Reading Jinguan 02 |',
                        code: err
                    });
                }
            });
            socket.pipe(socket);
            socket.on('error', function(err) {
                console.log('Error on Socket Reading Jinguan 02 : ', err);
                errorLogEvent.emit('errorLog', {
                    info: 'Error | socket Reading Jinguan 02 |',
                    code: err
                });
                socket.end();
                socket.destroy();
                socketReadingJinguan02.close();
                socketReadingJinguan02.listen(3010, '192.168.40.100', function() {
                    errorLogEvent.emit('errorLog', {
                        info: ' | socket Reading Jinguan 02 |',
                        code: 'socketReadingJinguan02 Rebooted '
                    }); 
                });
            });
            socket.on('close', function(c) {
                null;
            });
        })
    /* <------------------------------------------- */
}

async function manageDataModbusCobot() {
    let dataModbusCobot = modbusCobot(_cobotUR10);
    _cobotUR10.production.status.robot = dataModbusCobot.statusRobot;
    _cobotUR10.production.cardsCounters.droppedOnICI01 = dataModbusCobot.droppedOnICI01;
    _cobotUR10.production.cardsCounters.droppedOnICI02 = dataModbusCobot.droppedOnICI02;
    _cobotUR10.production.cobotBuffer.drawersOccuped.formatA = dataModbusCobot.drawersOccuped.formatA; 
    _cobotUR10.production.cobotBuffer.drawersOccuped.formatB = dataModbusCobot.drawersOccuped.formatB; 
    _cobotUR10.modbusCobot.status = dataModbusCobot.statusModbusCobot; 
    _cobotUR10.modbusCobot.protectiveStop = dataModbusCobot.protectiveStop;
    _cobotUR10.modbusCobot.emergencyStop = dataModbusCobot.emergencyStop;
}

async function manageDataModbusPLC_cobotUR10() {
    let dataPLC_cobotUR10 = modbusPLC_cobotUR10();
    _cobotUR10.monitoring.inputs = dataPLC_cobotUR10.inputs;
    _cobotUR10.monitoring.outputs = dataPLC_cobotUR10.outputs;
    _cobotUR10.statusModbusPLC = dataPLC_cobotUR10.statusModbusPLC;
}

async function manageDataModbusPLC_IJ01() {
    let dataPLC_IJ01 = modbusPLC_IJ01();
    _scaraIJ01.monitoring.outputs = dataPLC_IJ01.outputs;
    _scaraIJ01.monitoring.inputs = dataPLC_IJ01.inputs;
    _scaraIJ01.statusModbusPLC = dataPLC_IJ01.statusModbusPLC;
}

async function manageDataModbusPLC_IJ02() {
    let dataPLC_IJ02 = modbusPLC_IJ02();
    _scaraIJ02.monitoring.outputs = dataPLC_IJ02.outputs;
    _scaraIJ02.monitoring.inputs = dataPLC_IJ02.inputs;
    _scaraIJ02.statusModbusPLC = dataPLC_IJ02.statusModbusPLC;

}

async function manageDataModbusPLC_JM01() {
    let dataPLC_JM01 = modbusPLC_JM01();
    _scaraJM01.monitoring.outputs = dataPLC_JM01.outputs;
    _scaraJM01.monitoring.inputs = dataPLC_JM01.inputs;
    _scaraJM01.statusModbusPLC = dataPLC_JM01.statusModbusPLC;
}

async function manageDataModbusPLC_JM02() {
    let dataPLC_JM02 = modbusPLC_JM02();
    _scaraJM02.monitoring.outputs = dataPLC_JM02.outputs;
    _scaraJM02.monitoring.inputs = dataPLC_JM02.inputs;
    _scaraJM02.statusModbusPLC = dataPLC_JM02.statusModbusPLC;

}

async function manageDataFromMachines() {
    let objectMachinesData = machinesData();
    // console.log('objectMachinesData: ', objectMachinesData);
    _cobotUR10.production.status.safety = objectMachinesData._Metronic.status.relaySafety;
    _cobotUR10.production.status.metronic = objectMachinesData._Metronic.status.machine;
    _cobotUR10.production.status.ICI01 = objectMachinesData._ICI01.status.machine;
    _cobotUR10.production.status.ICI02 = objectMachinesData._ICI02.status.machine;
    _cobotUR10.production.cardsCounters.cardsContainer.inputA = objectMachinesData._Metronic.cardsContainer.inputA;
    _cobotUR10.production.cardsCounters.cardsContainer.inputB = objectMachinesData._Metronic.cardsContainer.inputB;
    _cobotUR10.production.cardsCounters.takenFromMetronic = objectMachinesData._Metronic.lotCounter.output;

    _scaraIJ01.production.status.safety = objectMachinesData._ICI01.status.relaySafety;
    _scaraIJ01.production.status.ICI = objectMachinesData._ICI01.status.machine;
    _scaraIJ01.production.status.Jinguan = objectMachinesData._Jinguan01.status.machine;
    _scaraIJ01.production.cardsCounters.takenFromICI = objectMachinesData._ICI01.lotCounter.output;
    _scaraIJ01.production.cardsCounters.droppedOnJinguan = objectMachinesData._Jinguan01.lotCounter.inputA;
    _scaraIJ01.production.cardsCounters.cardsContainer =  objectMachinesData._ICI01.cardsContainer.inputA;
    _scaraIJ01.production.cardsCounters.cardsRejected = objectMachinesData._ICI01.lotCounter.rejected;

    _scaraIJ02.production.status.safety = objectMachinesData._ICI02.status.relaySafety;
    _scaraIJ02.production.status.ICI = objectMachinesData._ICI02.status.machine;
    _scaraIJ02.production.status.Jinguan = objectMachinesData._Jinguan02.status.machine;
    _scaraIJ02.production.cardsCounters.takenFromICI = objectMachinesData._ICI02.lotCounter.output;
    _scaraIJ02.production.cardsCounters.droppedOnJinguan = objectMachinesData._Jinguan02.lotCounter.inputA;
    _scaraIJ02.production.cardsCounters.cardsContainer =  objectMachinesData._ICI02.cardsContainer.inputA;
    _scaraIJ02.production.cardsCounters.cardsRejected = objectMachinesData._ICI02.lotCounter.rejected;

    _scaraJM01.production.status.safety = objectMachinesData._Jinguan01.status.relaySafety;
    _scaraJM01.production.status.Jinguan = objectMachinesData._Jinguan01.status.machine;
    _scaraJM01.production.status.MPR = objectMachinesData._MPR01.status.machine;
    _scaraJM01.production.cardsCounters.takenFromJinguan = objectMachinesData._Jinguan01.lotCounter.output;
    _scaraJM01.production.cardsCounters.droppedOnMPR = objectMachinesData._MPR01.lotCounter.inputA;
    _scaraJM01.production.cardsCounters.cardsContainer =  objectMachinesData._Jinguan01.cardsContainer.inputA;
    _scaraJM01.production.cardsCounters.cardsRejected = objectMachinesData._Jinguan01.lotCounter.rejected;

    _scaraJM02.production.status.safety = objectMachinesData._Jinguan02.status.relaySafety;
    _scaraJM02.production.status.Jinguan = objectMachinesData._Jinguan02.status.machine;
    _scaraJM02.production.status.MPR = objectMachinesData._MPR02.status.machine;
    _scaraJM02.production.cardsCounters.takenFromJinguan = objectMachinesData._Jinguan02.lotCounter.output;
    _scaraJM02.production.cardsCounters.droppedOnMPR = objectMachinesData._MPR02.lotCounter.inputA;
    _scaraJM02.production.cardsCounters.cardsContainer =  objectMachinesData._Jinguan02.cardsContainer.inputA;
    _scaraJM02.production.cardsCounters.cardsRejected = objectMachinesData._Jinguan02.lotCounter.rejected;
}

async function resetShiftCardsCountersFunction(value) {
    modbusPLC_cobotUR10('resetShiftCardsCounters', value);
    modbusPLC_IJ01('resetShiftCardsCounters', value);
    modbusPLC_IJ02('resetShiftCardsCounters', value);
    modbusPLC_JM01('resetShiftCardsCounters', value);
    modbusPLC_JM02('resetShiftCardsCounters', value);
}

async function resetLotCardsCountersFunction(value) {
    modbusPLC_cobotUR10('resetLotCardsCounters', value);
    modbusPLC_IJ01('resetLotCardsCounters', value);
    modbusPLC_IJ02('resetLotCardsCounters', value);
    modbusPLC_JM01('resetLotCardsCounters', value);
    modbusPLC_JM02('resetLotCardsCounters', value);
    value ? _cobotUR10.production.cardsCounters.resetLotCardsCounters = '1' : _cobotUR10.production.cardsCounters.resetLotCardsCounters = '0';
    modbusCobot(_cobotUR10);

}

async function getDataFromShiftsCounters() {
    
    for (let i = 1; i < 8 ; i++) {
        let machine = switchMachine(i);
        let result = await db.SELECT(`SELECT TOP 3 * FROM CounterShift WHERE idMachine = ${i} ORDER BY creationDateTime DESC`);
        // console.log(result);
        if (result.rowsAffected[0] == 0 ){
            null
        } else { 
            if (result.rowsAffected[0] == 1){
                if (machine == 'Metronic'){
                    _machineShiftsCounters[`${machine}`].actualShift.inputA = result.recordset[0].inputA;
                    _machineShiftsCounters[`${machine}`].actualShift.inputB = result.recordset[0].inputB;
                } else {
                    _machineShiftsCounters[`${machine}`].actualShift.input = result.recordset[0].inputA;
                }
                _machineShiftsCounters[`${machine}`].actualShift.machineOn = result.recordset[0].machineOn;
                _machineShiftsCounters[`${machine}`].actualShift.machineOff = result.recordset[0].machineOff;

            } else if (result.rowsAffected[0] == 2) {
                if (machine == 'Metronic') {
                    _machineShiftsCounters[`${machine}`].actualShift.inputA = result.recordset[0].inputA;
                    _machineShiftsCounters[`${machine}`].actualShift.inputB = result.recordset[0].inputB;
                    _machineShiftsCounters[`${machine}`].lastShift.inputA = result.recordset[1].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift.inputB = result.recordset[1].inputB;
                }else {
                    _machineShiftsCounters[`${machine}`].actualShift.input = result.recordset[0].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift.input = result.recordset[1].inputA;
                }
                _machineShiftsCounters[`${machine}`].actualShift.machineOn = result.recordset[0].machineOn;
                _machineShiftsCounters[`${machine}`].actualShift.machineOff = result.recordset[0].machineOff;
                _machineShiftsCounters[`${machine}`].lastShift.machineOn = result.recordset[1].machineOn;
                _machineShiftsCounters[`${machine}`].lastShift.machineOff = result.recordset[1].machineOff;
            } else if (result.rowsAffected[0] == 3){
                if (machine == 'Metronic') {
                    _machineShiftsCounters[`${machine}`].actualShift.inputA = result.recordset[0].inputA;
                    _machineShiftsCounters[`${machine}`].actualShift.inputB = result.recordset[0].inputB;
                    _machineShiftsCounters[`${machine}`].lastShift.inputA = result.recordset[1].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift.inputB = result.recordset[1].inputB;
                    _machineShiftsCounters[`${machine}`].lastShift2.inputA = result.recordset[2].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift2.inputB = result.recordset[2].inputB;
                } else {
                    _machineShiftsCounters[`${machine}`].actualShift.input = result.recordset[0].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift.input = result.recordset[1].inputA;
                    _machineShiftsCounters[`${machine}`].lastShift2.input = result.recordset[2].inputA;
                }
                _machineShiftsCounters[`${machine}`].actualShift.machineOn = result.recordset[0].machineOn;
                _machineShiftsCounters[`${machine}`].actualShift.machineOff = result.recordset[0].machineOff;
                _machineShiftsCounters[`${machine}`].lastShift.machineOn = result.recordset[1].machineOn;
                _machineShiftsCounters[`${machine}`].lastShift.machineOff = result.recordset[1].machineOff;
                _machineShiftsCounters[`${machine}`].lastShift2.machineOn = result.recordset[2].machineOn;
                _machineShiftsCounters[`${machine}`].lastShift2.machineOff = result.recordset[2].machineOff;
            }
        }
    }
    _firstTime = false;
}

function switchMachine (i){
    switch (i) {
        case 1:
            machine = 'Metronic'
            break;
        case 2:
            machine = 'ICI01';
            break;
        case 3:
            machine = 'Jinguan01';
            break;
        case 4:
            machine = 'MPR01';
            break;
        case 5:
            machine = 'ICI02';
            break;
        case 6: 
            machine = 'Jinguan02';
            break;
        case 7:
            machine = 'MPR02';
            break;
        default:
            break;
    }
    return machine;
}

function socket_io (socket) {
    io = socket;
}

try {
    main();
} catch (error) {
    console.log(error);
}

module.exports = {
    router: router,
    socket_io: socket_io
}