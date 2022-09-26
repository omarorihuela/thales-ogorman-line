/* 
    ** This program manage all the comunication with the 
    scaraJM01's PLC via modbus. Read and write the modbus'
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

var _scaraJM02 = {
    setPointCards: 50,
    openGripper: false
}
var _Jinguan02 = {
    name: 'Jinguan02',
    cardsContainer: 0,
    status: {
        machine: false,
        relaySafety: false
    },
    shiftCounter: {
        input: 0,
        output: 0
    },
    lotCounter: {
        input: 0,
        output: 0
    },
    timeWorking: {
        machineOn: 0,
        machineOff: 0
    }
}
var _MPR02 = {
    name: 'MPR02',
    status: {
        machine: false,
        relaySafety: false
    },
    shiftCounter: {
        input: 0,
        output: 0,
        rejected: 0
    },
    lotCounter: {
        input: 0,
        output: 0,
        rejected: 0
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
        I0_06: false,   //Lower lever sensor on Jinguan
        I0_07: false,   //Lower level sensor on MPR
        I0_08: false,   //Upper level sensor on MPR
        I0_09: false,   //Gripper
        I0_10: false,   //Cards taken from Jinguan
        I0_11: false,   //Jinguan (Run / Stop)
        I0_12: false,   //MPR (Run / Stop)
        I0_13: false,   //Counter input cards sensor Jinguan 
        I0_14: false,   //Counter output cards sensor Jinguan 
        I0_15: false,   //Cards rejected sensor
        I0_16: false,   //Counter input cards sensor MPR
        I0_17: false,   ////Counter output cards sensor MPR
        I0_18: false,   //Scara ready
        I0_19: false    //Scara error
    },
    outputs: {
        O1_00: false,   //Cards pre-availables on PickPoint Jinguan
        O1_01: false,   //Take cards on PickPoint Jinguan
        O1_02: false,   //Drop cards on DropPoint MPR
        O1_03: false,   //Green light
        O1_04: false,   //Yellow light
        O1_05: false,   //Red light
        O1_06: false,   //Start Scara
        O1_07: false,   //Continue Scara
        O1_08: false,   //Pause Scara
        O1_09: false,   //Reset Scara
        O1_10: false,   //Gripper
        O1_11: false,   //Gripper feddback (Send to Scara)
        O2_00: false,   //Start Jinguan
        O2_01: false    //Pause Jinguan
    }
}

//Settings to stablish the comunication
var client1 = modbus.client.tcp.complete({
    'host': '192.168.40.51',
    'port': 502,
    'autoReconnect': true,
    'timeout': 5000,
    'logEnabled': true,
    'reconnectTimeout': 1000
});
client1.connect();

client1.on('connect', async function() {
    console.log("PLC scaraJM02 connected");
    _PLC.statusModbusPLC = true;
    
    while (_PLC.statusModbusPLC) {
        client1.readHoldingRegisters(0, 19).then(function(resp) {
            // console.log('Reading registers: 0 -> 18');
            let data = resp.register;
            // console.log(data);

            _Jinguan02.lotCounter.input = data[0] + data[1]*65536;
            _Jinguan02.lotCounter.output = data[2] + data[3]*65536;
            _MPR02.lotCounter.input = data[4] + data[5]*65536;
            _MPR02.lotCounter.output = data[6] + data[7]*65536;
            _Jinguan02.shiftCounter.input = data[8] + data[9]*65536;
            _Jinguan02.shiftCounter.output = data[10] + data[11]*65536;
            _MPR02.shiftCounter.input = data[12] + data[13]*65536;
            _MPR02.shiftCounter.output = data[14] + data[15]*65536;
            _MPR02.lotCounter.rejected = data[16];    
            _MPR02.shiftCounter.rejected = data[17];
            _Jinguan02.cardsContainer = data[18];

            // console.log('Jinguan : ', _Jinguan02);

            //console.log(resp);            
        }, function(err) {
            console.error;
            console.log('PLC JM02 | Error Reading Holding Registers: 0 -> 18');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Reading Holding Register 0 : 18 |',
                code: err
            });
        });

        client1.writeSingleRegister(19, _scaraJM02.setPointCards).then(function(resp){
            // console.log('Writting Register: 21 -> Value: ', _scaraJM02.setPointCards);
            //console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC JM01 | Error Writing Single Register: 19');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Writing Single Register 19 |',
                code: err
            });
        });

        client1.readCoils(0,3).then(function(resp) {
            // console.log('Reading Bool: 0 -> 2');
            //console.log(resp);
            let data = resp.coils;
            _Jinguan02.status.relaySafety = data[0];
            _Jinguan02.status.machine = data[1];
            _MPR02.status.machine = data[2]
        }, function(err) {
            console.error;
            console.log('PLC JM02 | Error Reading Coils: 0 -> 2');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Reading Coils 0 : 2 |',
                code: err
            });
        });

        client1.writeMultipleCoils(3,[_scaraJM02.openGripper,_resetLotCardsCounters,_resetShiftCardsCounters]).then(function(resp) {
            // console.log(_scaraJM02.openGripper);
            // console.log('Writing Bool: 2 -> 4');
            // console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC JM02 | Error Writing Coils: 3 -> 5');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Writing Coils 3 : 5 |',
                code: err
            });
        });

        client1.readCoils(99,119).then(function(resp) {
            // console.log('Reading Bool: 99 -> 118');
            //console.log(resp);
            let data = resp.coils;
            _PLC.inputs.I0_00 = data[0];    //Start Button
            _PLC.inputs.I0_01 = data[1];    //Pause Button  
            _PLC.inputs.I0_02 = data[2];    //Reset Button
            _PLC.inputs.I0_03 = data[3];    //Status safety relay
            _PLC.inputs.I0_04 = data[4];    //Thermostat
            _PLC.inputs.I0_05 = data[5];    //Pressure switch
            _PLC.inputs.I0_06 = data[6];    //Lower lever sensor on Jinguan
            _PLC.inputs.I0_07 = data[7];    //Lower level sensor on MPR
            _PLC.inputs.I0_08 = data[8];    //Upper level sensor on MPR
            _PLC.inputs.I0_09 = data[9];    //Gripper
            _PLC.inputs.I0_10 = data[10];   //Cards taken from Jinguan
            _PLC.inputs.I0_11 = data[11];   //Jinguan (Run / Stop)
            _PLC.inputs.I0_12 = data[12];   //MPR (Run / Stop)
            _PLC.inputs.I0_13 = data[13];   //Counter input cards sensor Jinguan 
            _PLC.inputs.I0_14 = data[14];   //Counter output cards sensor Jinguan 
            _PLC.inputs.I0_15 = data[15];   //Cards rejected sensor
            _PLC.inputs.I0_16 = data[16];   //Counter input cards sensor MPR
            _PLC.inputs.I0_17 = data[17];   ////Counter output cards sensor MPR
            _PLC.inputs.I0_18 = data[18];   //Scara ready
            _PLC.inputs.I0_19 = data[19];   //Scara error
        }, function(err) {
            console.error;
            console.log('PLC JM02 | Error Reading Coils: 99 -> 118');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Reading Coils 99 : 118 |',
                code: err
            });
        });

        client1.readCoils(119,133).then(function(resp) {
            // console.log('Reading Bool: 119 -> 132');
            //console.log(resp);
            let data = resp.coils;
            _PLC.outputs.O1_00 = data[0];   //Cards pre-availables on PickPoint Jinguan
            _PLC.outputs.O1_01 = data[1];   //Take cards on PickPoint Jinguan
            _PLC.outputs.O1_02 = data[2];   //Drop cards on DropPoint MPR
            _PLC.outputs.O1_03 = data[3];   //Green light
            _PLC.outputs.O1_04 = data[4];   //Yellow light
            _PLC.outputs.O1_05 = data[5];   //Red light
            _PLC.outputs.O1_06 = data[6];   //Start Scara
            _PLC.outputs.O1_07 = data[7];   //Continue Scara
            _PLC.outputs.O1_08 = data[8];   //Pause Scara
            _PLC.outputs.O1_09 = data[9];   //Reset Scara
            _PLC.outputs.O1_10 = data[10];  //Gripper
            _PLC.outputs.O1_11 = data[11];  //Gripper feddback (Send to Scara)
            _PLC.outputs.O2_00 = data[12];  //Start Jinguan
            _PLC.outputs.O2_01 = data[13];  //Pause Jinguan
        }, function(err) {
            console.error;
            console.log('PLC JM02 | Error Reading Coils: 119 -> 132');
            emitter.emit('errorLog', {
                info: 'Error | PLC JM02 | Reading Coils 119 : 132 |',
                code: err
            });
        });

        if (counterSeconds == 600) {
            _Jinguan02.status.machine ? _Jinguan02.timeWorking.machineOn++ : _Jinguan02.timeWorking.machineOff++
            _MPR02.status.machine ? _MPR02.timeWorking.machineOn++ : _MPR02.timeWorking.machineOff++
            counterSeconds = 0;
        }

        await machinesData().upDateMachine(_Jinguan02);
        await machinesData().upDateMachine(_MPR02);
        await delay(100);   
        counterSeconds ++;
    }
});  

// Catch the error if there is one.
client1.on('error', (err) => {
    console.log('Error Omar');
    _PLC.statusModbusPLC = false;
    client1.reconnect();
    emitter.emit('errorLog', {
        info: 'Error | PLC JM02 | Connection Failed |',
        code: err
    });
});

module.exports = function (task, value) {
    if (task == 'setPointCards'){
        _scaraJM02.setPointCards = parseInt(value);
    }
    if (task == 'openGripper'){
        _scaraJM02.openGripper = value;
    }  
    if (task == 'resetLotCardsCounters'){
        _resetLotCardsCounters = value;
    }
    if (task == 'resetShiftCardsCounters'){
        _resetShiftCardsCounters = value;
        _Jinguan02.timeWorking.machineOn = 0;
        _Jinguan02.timeWorking.machineOff = 0;
        _MPR02.timeWorking.machineOn = 0;
        _MPR02.timeWorking.machineOff = 0;
    } else if (task == 'timeWorkingJinguan') {
        _Jinguan02.timeWorking.machineOn = value[0];
        _Jinguan02.timeWorking.machineOff = value[1];
    } else if (task == 'timeWorkingMPR') {
        _MPR02.timeWorking.machineOn = value[0];
        _MPR02.timeWorking.machineOff = value[1];
    }
    return _PLC;
}

module.exports.event = {emitter};
