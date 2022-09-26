/* 
    ** This program manage all the comunication with the 
    cobotUR10's PLC via modbus. Read and write the modbus'
    registers and then pass the data to routes.js **
*/
const modbus = require('jsmodbus');
const machinesData = require('./machinesData');
const delay = require('delay');
const event = require('events');

var emitter = new event();

var _resetLotCardsCounters = false;
var _resetShiftCardsCounters = false;
var counterSeconds = 0;

var _cobotUR10 = {
    setPointCards: 50,
    openGripper: false,
    protectiveStop: false,
    emergencyStop: false
}
var _Metronic = {
    name: 'Metronic',
    cardsContainer: {
        inputA: 0,
        inputB: 0
    },
    status: {
        machine: false,
        relaySafety: false
    },
    shiftCounter: {
        inputA: 0,
        inputB: 0,
        output: 0,
        rejected: 0
    },
    lotCounter: {
        inputA: 0,
        inputB: 0,
        output: 0,
        rejected: 0
    },
    band: {
        start: false,
        pause: true,
        reset: false
    },
    timeWorking: {
        machineOn: 0,
        machineOff: 0
    }
}
var _PLC = {
    statusModbusPLC: false,
    inputs: {
        I0_00: false,   //Start Button
        I0_01: false,   //Pause Button  
        I0_02: false,   //Reset Button
        I0_03: false,   //Status safety relay
        I0_04: false,   //Thermostat
        I0_05: false,   //Pressure switch
        I0_06: false,   //Sensor on Metronic Box 02
        I0_07: false,   //Counter sensor on Metronic
        I0_08: false,   //Sensor on Metronic Box 01
        I0_09: false,   //Level Up sensor on ICI01
        I0_10: false,   //Level Up sensor on ICI02
        I0_11: false,   //Gripper (Comes from Cobot)
        I0_12: false,   //Band failure
        I0_13: false,   //Cards taken from Metronic (Comes from Cobot)
        I0_14: false,   //Metronic state (Run / Stop)
        I0_15: false,   //Top face card counter sensor
        I0_16: false,   //Bottom face card counter sensor
        I0_17: false    //Reject card sensor
    },
    outputs: {
        O1_00: false,   //Cards availables on PickPoint 01
        O1_01: false,   //Cards availables on PickPoint 02
        O1_02: false,   //Drop cards on ICI01
        O1_03: false,   //Drop cards on ICI02
        O1_04: false,   //Green light
        O1_05: false,   //Yellow light
        O1_06: false,   //Red light
        O1_07: false,   //Start UR10
        O1_08: false,   //PauseUR10
        O1_09: false,   //Gripper
        O1_10: false,   //Gripper feedback to cobotUR10
        O1_11: false,   //Start band
        O2_00: false,   //Stop band
        O2_01: false,   //Reset band
        O2_02: false,   //Move piston
        O2_03: false,   //Move piston 01
        O2_04: false    //Move piston 02
    }
}

//Settings to stablish the comunication
var client1 = modbus.client.tcp.complete({
    'host': '192.168.40.31',
    'port': 502,
    'autoReconnect': true,
    'timeout': 5000,
    'logEnabled': true,
    'reconnectTimeout': 1000
});
client1.connect();

client1.on('connect', async function() {
    console.log("PLC UR10 connected");
    _PLC.statusModbusPLC = true;
    
    while (_PLC.statusModbusPLC) {
        client1.readHoldingRegisters(0, 16).then(function(resp) {
            // console.log('Reading registers: 0 -> 15');
            let data = resp.register;
            // console.log(data);

            _Metronic.lotCounter.inputA = data[0] + data[1]*65536;
            _Metronic.lotCounter.inputB = data[2] + data[3]*65536;
            _Metronic.lotCounter.output = data[4] + data[5]*65536;
            _Metronic.shiftCounter.inputA = data[6] + data[7]*65536;
            _Metronic.shiftCounter.inputB = data[8] + data[9]*65536;
            _Metronic.shiftCounter.output = data[10] + data[11]*65536;
            _Metronic.lotCounter.rejected = data[12];    
            _Metronic.shiftCounter.rejected = data[13];
            _Metronic.cardsContainer.inputA = data[14];
            _Metronic.cardsContainer.inputB = data[15];

            // console.log('Metronic : ', _Metronic);

            //console.log(resp);            
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Reading Holding Registers: 0 -> 15');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Reading Holding Register 0 : 15 |',
                code: err
            });
        });

        client1.writeSingleRegister(16, _cobotUR10.setPointCards).then(function(resp){
            // console.log('Writting Register: 16 -> Value: ', _cobotUR10.setPointCards);
            //console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Writing Single Registers: 16');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Writing Sinigle Register 16 |',
                code: err
            });
        });

        client1.readCoils(0,2).then(function(resp) {
            // console.log('Reading Bool: 0 -> 1');
            // console.log(resp);
            let data = resp.coils;
            _Metronic.status.relaySafety = data[0];
            _Metronic.status.machine = data[1];
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Reading Coils: 0 -> 1');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Reading Coils 0 : 1 |',
                code: err
            });
        });

        let dataToWrite = [_cobotUR10.openGripper,
            _resetLotCardsCounters,
            _resetShiftCardsCounters,
            _cobotUR10.protectiveStop,
            _cobotUR10.emergencyStop,
            _Metronic.band.start,
            _Metronic.band.pause,
            _Metronic.band.reset];

        client1.writeMultipleCoils(2,dataToWrite).then(function(resp) {
            // console.log('Writing Bool: 2 -> 6');
            //console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Writing Coils: 2 -> 6');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Writing Coils 2 : 6 |',
                code: err
            });
        });

        client1.readCoils(99,117).then(function(resp) {
            // console.log('Reading Bool: 99 -> 116');
            // console.log(resp);
            let data = resp.coils;
            _PLC.inputs.I0_00 = data[0];    //Start Button   
            _PLC.inputs.I0_01 = data[1];    //Pause Button     
            _PLC.inputs.I0_02 = data[2];    //Reset Button   
            _PLC.inputs.I0_03 = data[3];    //Status safety relay   
            _PLC.inputs.I0_04 = data[4];    //Thermostat   
            _PLC.inputs.I0_05 = data[5];    //Pressure switch   
            _PLC.inputs.I0_06 = data[6];    //Sensor on Metronic Box 02   
            _PLC.inputs.I0_07 = data[7];    //Counter sensor on Metronic   
            _PLC.inputs.I0_08 = data[8];    //Sensor on Metronic Box 01   
            _PLC.inputs.I0_09 = data[9];    //Level Up sensor on ICI01   
            _PLC.inputs.I0_10 = data[10];   //Level Up sensor on ICI02   
            _PLC.inputs.I0_11 = data[11];   //Gripper (Comes from Cobot)   
            _PLC.inputs.I0_12 = data[12];   //Band failure   
            _PLC.inputs.I0_13 = data[13];   //Cards taken from Metronic (Comes from Cobot)   
            _PLC.inputs.I0_14 = data[14];   //Metronic state (Run / Stop)   
            _PLC.inputs.I0_15 = data[15];   //Top face card counter sensor
            _PLC.inputs.I0_16 = data[16];   //Bottom face card counter sensor
            _PLC.inputs.I0_17 = data[17];   //Reject card sensor      
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Reading Coils: 99 -> 116');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Reading Coils 99 : 116 |',
                code: err
            });
        });

        client1.readCoils(119,139).then(function(resp) {
            // console.log('Reading Bool: 119 -> 138');
            //console.log(resp);
            let data = resp.coils;
            _PLC.outputs.O1_00 = data[0];   //Cards availables on PickPoint 01
            _PLC.outputs.O1_01 = data[1];   //Cards availables on PickPoint 02
            _PLC.outputs.O1_02 = data[2];   //Drop cards on ICI01
            _PLC.outputs.O1_03 = data[3];   //Drop cards on ICI02
            _PLC.outputs.O1_04 = data[4];   //Green light
            _PLC.outputs.O1_05 = data[5];   //Yellow light
            _PLC.outputs.O1_06 = data[6];   //Red light
            _PLC.outputs.O1_07 = data[7];   //Start UR10
            _PLC.outputs.O1_08 = data[8];   //PauseUR10
            _PLC.outputs.O1_09 = data[9];   //Gripper
            _PLC.outputs.O1_10 = data[10];  //Gripper feedback to cobotUR10
            _PLC.outputs.O1_11 = data[11];  //Start band
            _PLC.outputs.O2_00 = data[12];  //Stop band
            _PLC.outputs.O2_01 = data[13];  //Reset band
            _PLC.outputs.O2_02 = data[14];  //Move piston
            _PLC.outputs.O2_03 = data[15];  //Move piston 01
            _PLC.outputs.O2_04 = data[16];   //Move piston 02
            _PLC.outputs.O2_05 = data[17];   //Start PowerFlex
            _PLC.outputs.O2_06 = data[18];   //PAuse PowerFlex
            _PLC.outputs.O2_07 = data[19];   //Reset PowerFlex
        }, function(err) {
            console.error;
            console.log('PLC Cobot UR10 | Error Reading Coils: 119 -> 138');
            emitter.emit('errorLog', {
                info: 'Error | PLC Cobot UR10 | Reading Coils 119 : 138 |',
                code: err
            });
        });
        
        if (counterSeconds == 600) {
            _Metronic.status.machine ? _Metronic.timeWorking.machineOn++ : _Metronic.timeWorking.machineOff++
            counterSeconds = 0;
        }

        machinesData().upDateMachine(_Metronic);
        await delay(100);   
        counterSeconds ++;
    }
}); 

// Catch the error if there is one.
client1.on('error', (err) => {
    console.log('Error on modbus CobotUR10 | ', err);
    _PLC.statusModbusPLC = false;
    client1.reconnect();
    emitter.emit('errorLog', {
        info: 'Error | PLC Cobot UR10 | Connection Failed |',
        code: err
    });
});

module.exports = function (task, value) {
    if (task == 'setPointCArds'){
        _cobotUR10.setPointCards = parseInt(value);
    } else if (task == 'openGripper'){
        value == '1' ? _cobotUR10.openGripper = true : _cobotUR10.openGripper = false;
    } else if (task == 'resetLotCardsCounters'){
        value == '1' ? _resetLotCardsCounters = true : _resetLotCardsCounters = false;
    } else if (task == 'resetShiftCardsCounters'){
        value == '1' ? _resetShiftCardsCounters = true : _resetShiftCardsCounters = false;
        _Metronic.timeWorking.machineOn = 0;
        _Metronic.timeWorking.machineOff = 0;
    } else if (task == 'protectiveStop') {
        _cobotUR10.protectiveStop = value;
    } else if (task == 'emergencyStop') {
        _cobotUR10.emergencyStop = value;
    } else if (task == 'bandStart') {
        _Metronic.band.start = true;
        _Metronic.band.pause = true;
        _Metronic.band.reset = false;
    } else if (task == 'bandStop') {
        _Metronic.band.start = false;
        _Metronic.band.pause = false;
        _Metronic.band.reset = false;
    } else if (task == 'bandReset') {
        _Metronic.band.reset = true;
        _Metronic.band.start = false;
        _Metronic.band.pause = true;
    } else if (task == 'timeWorking') {
        _Metronic.timeWorking.machineOn = value[0];
        _Metronic.timeWorking.machineOff = value[1];
    }
    return _PLC;
}

module.exports.event = {emitter};
