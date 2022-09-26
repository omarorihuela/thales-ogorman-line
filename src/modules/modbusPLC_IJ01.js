/* 
    ** This program manage all the comunication with the 
    scaraIJ02's PLC via modbus. Read and write the modbus'
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

var _scaraIJ01 = {
    setPointCards: 50,
    openGripper: false
}
var _ICI01 = {
    name: 'ICI01',
    cardsContainer: 0,
    status: {
        machine: false,
        relaySafety: false
    },
    shiftCounter: {
        input: 0,
        output: 0,
        rejected: 0,
        _Jinguan01:{
            rejected: 0
        }
    },
    lotCounter: {
        input: 0,
        output: 0,
        rejected: 0,
        _Jinguan01: {
            rejected: 0
        }
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
        I0_06: false,   //Lower lever sensor on ICI  
        I0_07: false,   //Upper level sensor on Jinguan    
        I0_08: false,   //Gripper    
        I0_09: false,   //Cards taken from ICI (Comes form scaraIJ)   
        I0_10: false,   //State ICI (Run / Stop)  
        I0_11: false,   //Counter input cards sensor ICI 
        I0_12: false,   //Counter output cards sensor ICI  
        I0_13: false,   //Rejected cards sensor   
        I0_14: false,   //Scara ready
        I0_15: false,   //Scara error
        I0_16: false    //Cards Rejected sensor Jinguan
    },
    outputs: {
        O1_00: false,   //Cards pre-availables on PickPoint ICI
        O1_01: false,   //Take cards on PickPoint ICI
        O1_02: false,   //Drop cards on DropPoint Jinguan
        O1_03: false,   //Green light
        O1_04: false,   //Yellow light
        O1_05: false,   //Red light
        O1_06: false,   //Start Scara
        O1_07: false,   //Continue Scara
        O1_08: false,   //Pause Scara
        O1_09: false,   //Reset Scara
        O1_10: false,   //Gripper 
        O1_11: false,   //Gripper feddback (Send to Scara)
        O2_00: false,   //Start ICI
        O2_01: false    //Pause ICI
    }
}

//Settings to stablish the comunication
var client1 = modbus.client.tcp.complete({
    'host': '192.168.40.21',
    'port': 502,
    'autoReconnect': true,
    'timeout': 5000,
    'logEnabled': true,
    'reconnectTimeout': 1000
});
client1.connect();

client1.on('connect', async function() {
    console.log("PLC scaraIJ01 connected");
    _PLC.statusModbusPLC = true;
    
    while (_PLC.statusModbusPLC) {
        client1.readHoldingRegisters(0, 13).then(function(resp) {
            // console.log('Reading registers: 0 -> 12');
            let data = resp.register;
            // console.log(data);

            _ICI01.lotCounter.input = data[0] + data[1]*65536;
            _ICI01.lotCounter.output = data[2] + data[3]*65536;
            _ICI01.shiftCounter.input = data[4] + data[5]*65536;
            _ICI01.shiftCounter.output = data[6] + data[7]*65536;
            _ICI01.lotCounter.rejected = data[8];    
            _ICI01.shiftCounter.rejected = data[9];
            _ICI01.lotCounter._Jinguan01.rejected = data[10];
            _ICI01.shiftCounter._Jinguan01.rejected = data[11];
            _ICI01.cardsContainer = data[12];

            // console.log('ICI : ', _ICI01);

            //console.log(resp);            
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Reading Holding Registers: 0 -> 12');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Reading Holding Register 0 : 12 |',
                code: err
            });
        });

        client1.writeSingleRegister(13, _scaraIJ01.setPointCards).then(function(resp){
            // console.log('Writting Register: 21 -> Value: ', _scaraIJ01.setPointCards);
            //console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Writing Single Register: 13');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Writing Single Register 13 |',
                code: err
            });
        });

        client1.readCoils(0,2).then(function(resp) {
            // console.log('Reading Bool: 0 -> 1');
            //console.log(resp);
            let data = resp.coils;
            _ICI01.status.relaySafety = data[0];
            _ICI01.status.machine = data[1];
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Reading Coils: 0 -> 1');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Reading Coils 0 : 1 |',
                code: err
            });
        });

        client1.writeMultipleCoils(2,[_scaraIJ01.openGripper,_resetLotCardsCounters,_resetShiftCardsCounters]).then(function(resp) {
            // console.log('Writing Bool: 2 -> 5');
            //console.log(resp);
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Writing Coils: 2 -> 4');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Writing Coils 2 : 4 |',
                code: err
            });
        });

        client1.readCoils(99,116).then(function(resp) {
            // console.log('Reading Bool: 99 -> 115');
            //console.log(resp);
            let data = resp.coils;
            _PLC.inputs.I0_00 = data[0];    //Start Button    
            _PLC.inputs.I0_01 = data[1];    //Pause Button      
            _PLC.inputs.I0_02 = data[2];    //Reset Button   
            _PLC.inputs.I0_03 = data[3];    //Status safety relay   
            _PLC.inputs.I0_04 = data[4];    //Thermostat    
            _PLC.inputs.I0_05 = data[5];    //Pressure switch  
            _PLC.inputs.I0_06 = data[6];    //Lower lever sensor on ICI  
            _PLC.inputs.I0_07 = data[7];    //Upper level sensor on Jinguan    
            _PLC.inputs.I0_08 = data[8];    //Gripper    
            _PLC.inputs.I0_09 = data[9];    //Cards taken from ICI (Comes form scaraIJ)   
            _PLC.inputs.I0_10 = data[10];   //State ICI (Run / Stop)  
            _PLC.inputs.I0_11 = data[11];   //Counter input cards sensor ICI 
            _PLC.inputs.I0_12 = data[12];   //Counter output cards sensor ICI  
            _PLC.inputs.I0_13 = data[13];   //Rejected cards sensor   
            _PLC.inputs.I0_14 = data[14];   //Scara ready
            _PLC.inputs.I0_15 = data[15];   //Scara error
            _PLC.inputs.I0_16 = data[16];   //Cards Rejected sensor Jinguan  
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Reading Coils: 99 -> 115');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Reading Coils 99 : 115 |',
                code: err
            });
        });

        client1.readCoils(119,133).then(function(resp) {
            // console.log('Reading Bool: 119 -> 132');
            //console.log(resp);
            let data = resp.coils;
            _PLC.outputs.O1_00 = data[0];   //Cards pre-availables on PickPoint ICI
            _PLC.outputs.O1_01 = data[1];   //Take cards on PickPoint ICI
            _PLC.outputs.O1_02 = data[2];   //Drop cards on DropPoint Jinguan
            _PLC.outputs.O1_03 = data[3];   //Green light
            _PLC.outputs.O1_04 = data[4];   //Yellow light
            _PLC.outputs.O1_05 = data[5];   //Red light
            _PLC.outputs.O1_06 = data[6];   //Start Scara
            _PLC.outputs.O1_07 = data[7];   //Continue Scara
            _PLC.outputs.O1_08 = data[8];   //Pause Scara
            _PLC.outputs.O1_09 = data[9];   //Reset Scara
            _PLC.outputs.O1_10 = data[10];  //Gripper 
            _PLC.outputs.O1_11 = data[11];  //Gripper feddback (Send to Scara)
            _PLC.outputs.O2_00 = data[12];  //Start ICI
            _PLC.outputs.O2_01 = data[13];  //Pause ICI
        }, function(err) {
            console.error;
            console.log('PLC IJ01 | Error Reading Coils: 119 -> 132');
            emitter.emit('errorLog', {
                info: 'Error | PLC IJ01 | Reading Coils 119 : 132 |',
                code: err
            });
        });

        if (counterSeconds == 600) {
            _ICI01.status.machine ? _ICI01.timeWorking.machineOn++ : _ICI01.timeWorking.machineOff++
            counterSeconds = 0;
        }
        machinesData().upDateMachine(_ICI01);
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
        info: 'Error | PLC IJ01 | Connection Failed |',
        code: err
    });
});

module.exports = function (task, value) {
    if (task == 'setPointCards'){
        _scaraIJ01.setPointCards = parseInt(value);
    }
    if (task == 'openGripper'){
        _scaraIJ01.openGripper = value;
    }  
    if (task == 'resetLotCardsCounters'){
        _resetLotCardsCounters = value;
    }
    if (task == 'resetShiftCardsCounters'){
        _resetShiftCardsCounters = value;
        _ICI01.timeWorking.machineOn = 0;
        _ICI01.timeWorking.machineOff = 0;
    } else if (task == 'timeWorking') {
        _ICI01.timeWorking.machineOn = value[0];
        _ICI01.timeWorking.machineOff = value[1];
    }
    return _PLC;
}

module.exports.event = {emitter};
