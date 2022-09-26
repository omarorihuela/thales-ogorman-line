/* 
    ** This program manage all the comunication with the 
    Cobot via modbus and pass the variables to the 
    routes.js program. **
*/
const modbus = require('jsmodbus');
const event = require('events');
const delay = require('delay');

var emitter = new event();

var _cobotUR10 = null;

var droppedOnICI01  = 0;
var droppedOnICI02 = 0;
var takenFromMetronic = 0;
var changeFormat = '0';
var bufferReseted = false;
var drawersOccuped = {
    formatA: 0,
    formatB: 0
}
var statusRobot = 'Desconectado';
var statusModbusCobot = false;
var protectiveStop = false;
var emergencyStop = false;

//Settings to stablish the comunication
var client1 = modbus.client.tcp.complete({
    'host': "192.168.40.30",
    'port': 502,
    'autoReconnect': true,
    'timeout': 5000,
    'logEnabled': true,
    'reconnectTimeout': 1000
});
client1.connect();

//Detect the conection with the cobot.
client1.on('connect', async function() {
    console.log("Modbus Cobot connected");

    statusModbusCobot = true;

    /* If there id a connection procceed to read and write 
    the modbus' reisters ---------------------> */
    while (statusModbusCobot) {  

        if (_cobotUR10 == null){
            client1.readHoldingRegisters(258, 1).then(function(resp) {});
        } else {    

            client1.readHoldingRegisters(130, 6).then(function(resp) {
                // console.log('Reading registers: 130 -> 135');
                let data = resp.register;       // Save the response from registers and save in 'data'.
                data = data.toString();         // Convert data to string
                data = data.split(',')          // Convert data to string array
                // console.log(data);   
                
                droppedOnICI01 = resp.register[0];          //Cards dropped on ICI01.
                droppedOnICI02 = resp.register[1];          //Cards dropped on ICI02.
                drawersOccuped.formatB = resp.register[3];  //Drawers occuped with formatB.
                drawersOccuped.formatA = resp.register[4];  //Drawers occuped form the Cobot Buffer with format A.
                changeFormat = resp.register[5];

                if (_cobotUR10.control.general.changeFormat == '1' && changeFormat == 1) {
                    emitter.emit('endChangeFormat');
                }
            }, function (err) {
                console.error;
                emitter.emit('errorLog', {
                    info: 'Error | Modbus Cobot | ReadingRegisters 130 : 135 |',
                    code: err
                });
            });
            
            client1.readHoldingRegisters(258, 1).then(function(resp){
                // console.log('Reading register: 258');
                let data = resp.register;
                
                if (data == 0) {statusRobot = 'Desconectado'}
                else if (data == 2) {statusRobot = 'Encendiendo'}
                else if (data == 3) {statusRobot = 'Robot apagado'}
                else if (data == 4) {statusRobot = 'Encendido'}
                else if (data == 5) {statusRobot = 'Inactivo'}
                else if (data == 7) {statusRobot = 'Ejecutando'}
                else {statusRobot = 'Ejecutando'}
            }, function(err) {
                console.error;
                emitter.emit('errorLog', {
                    info: 'Error | Modbus Cobot | ReadingRegisters 258 |',
                    code: err
                });
            });

            client1.readHoldingRegisters(261, 2).then(function(resp){
                // console.log('Reading register: 261');
                // console.log(resp);
                let data = resp.register;
                protectiveStop = data[0];
                emergencyStop = data[1];
                if (data[0]) {
                    statusRobot = 'Paro de protección';
                }
                emitter.emit('protectiveStop', data[0]);

                if (data[1]){
                    statusRobot = 'Paro de emergencia';
                }
                emitter.emit('emergencyStop', data[1]);

            }, function(err) {
                console.error;
                emitter.emit('errorLog', {
                    info: 'Error | Modbus Cobot | ReadingRegisters 261 : 262 |',
                    code: err
                });
            });
            
            let dataToWrite = [_cobotUR10.control.general.setPointCards,
                _cobotUR10.control.general.changeFormat,
                _cobotUR10.control.process.stateMetronic,
                _cobotUR10.control.process.stateBuffer,
                _cobotUR10.control.process.stateICI01,
                _cobotUR10.control.process.stateICI02,
                _cobotUR10.control.process.openGripper,
                _cobotUR10.production.cobotBuffer.resetBuffer,
                _cobotUR10.production.cardsCounters.resetLotCardsCounters];

            for (let i = 0 ; i < 8 ; i++){
                dataToWrite[i] = parseInt(dataToWrite[i]);
            }

            // console.log('Data to Write: ', dataToWrite);
            
            client1.writeMultipleRegisters(150, dataToWrite).then(function (resp) {
                // console.log('Writing registers: 150 -> 157');
                // resp will look like { fc: 6, byteCount: 4, registerAddress: 13, registerValue: 42 }
                // console.log(resp);
                
            }, function(err) {
                console.error;
                emitter.emit('errorLog', {
                    info: 'Error | Modbus Cobot | WritingRegisters 150 : 157 |',
                    code: err
                });
            });

            if (_cobotUR10.production.cobotBuffer.resetBuffer == '1') {
                console.log('Buffer reseteado');
                bufferReseted = true;
            }

            if (bufferReseted){
                emitter.emit('bufferReseted');
                bufferReseted = false;
            }                 
        }
        
        await delay(100);
    }
    /* <-------------------------------------- */
});

// Catch the error if there is one.
client1.on('error', (err) => {
    console.log('Error on ModbusCobot');
    statusModbusCobot = false;
    client1.reconnect();
    emitter.emit('errorLog', {
        info: 'Error | Modbus Cobot | Connection Failed |',
        code: err
    });
});

module.exports = function (data){
    _cobotUR10 = data;
    //Returns an object
    return {
        statusRobot,
        droppedOnICI01,
        droppedOnICI02,
        takenFromMetronic,
        drawersOccuped,
        statusModbusCobot,
        protectiveStop,
        emergencyStop,
        changeFormat
    }
}

module.exports.event = {emitter};