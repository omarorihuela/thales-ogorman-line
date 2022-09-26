/* Import the object structure of the machines -> */
const MACHINE = require('../models/machines/machine');
/* <--------------------------------------------- */

/* Create the object of each machine ---------> */
    var _Metronic = new MACHINE('Metronic', 1, 0) ;
    var _ICI01 = new MACHINE('ICI01', 2, null);
    var _Jinguan01 = new MACHINE('Jinguan01', 3, null);
    var _MPR01 = new MACHINE('MPR01', 4, null);
    var _ICI02 = new MACHINE('ICI02', 5, null);
    var _Jinguan02 = new MACHINE('Jinguan02', 6, null);
    var _MPR02 = new MACHINE('MPR02', 7, null);
/* <------------------------------------------- */
module.exports = function () {
    return{
        switchMachine: function(idMachine){
            /* This function returns the object of each machine
                according with the idMachine that recieves -> */
            switch (idMachine) {
                case 1:
                    return _Metronic;
                case 2:
                    return _ICI01 ;
                case 3:
                    return _Jinguan01;
                case 4:
                    return _MPR01;
                case 5:
                    return _ICI02;
                case 6:
                    return _Jinguan02;
                case 7:
                    return _MPR02;
                default:
                    break;
            }
        },
        upDateMachine: async function (dataFromPLC){
            /* 
                ** This function is called from
                the modbusPLC programs. **
            */
            let machine;
            if (dataFromPLC.name == 'Metronic'){
                machine = _Metronic;
                _Metronic.shiftCounter.inputA = dataFromPLC.shiftCounter.inputA;
                _Metronic.shiftCounter.inputB = dataFromPLC.shiftCounter.inputB;
                _Metronic.lotCounter.inputA = dataFromPLC.lotCounter.inputA;
                _Metronic.lotCounter.inputB = dataFromPLC.lotCounter.inputB;
                _Metronic.cardsContainer.inputA = dataFromPLC.cardsContainer.inputA;
                _Metronic.cardsContainer.inputB = dataFromPLC.cardsContainer.inputB;
            } else if(dataFromPLC.name == 'ICI01'){
                machine = _ICI01;
                _Jinguan01.shiftCounter.rejected = dataFromPLC.shiftCounter._Jinguan01.rejected;
                _Jinguan01.lotCounter.rejected = dataFromPLC.lotCounter._Jinguan01.rejected;
            } else if (dataFromPLC.name == 'ICI02'){
                machine = _ICI02;
                _Jinguan02.shiftCounter.rejected = dataFromPLC.shiftCounter._Jinguan02.rejected;
                _Jinguan02.lotCounter.rejected = dataFromPLC.lotCounter._Jinguan02.rejected;
            } else if (dataFromPLC.name == 'Jinguan01'){
                machine = _Jinguan01;
            } else if (dataFromPLC.name == 'Jinguan02'){
                machine = _Jinguan02;
            } else if( dataFromPLC.name == 'MPR01') {
                machine = _MPR01;
            } else if(dataFromPLC.name == 'MPR02') {
                machine = _MPR02;
            }

            // console.log('machine: ', machine);

            if (machine.name != 'Metronic') {
                machine.shiftCounter.inputA = dataFromPLC.shiftCounter.input;
                machine.lotCounter.inputA = dataFromPLC.lotCounter.input;
                if (machine.name != 'MPR01' && machine.name != 'MPR02'){
                    machine.cardsContainer.inputA = dataFromPLC.cardsContainer;
                }
            }
            if (machine.name != 'Jinguan01' && dataFromPLC.name != 'Jinguan02') {
                machine.shiftCounter.rejected = dataFromPLC.shiftCounter.rejected;
                machine.lotCounter.rejected = dataFromPLC.lotCounter.rejected;
            }

            machine.shiftCounter.output = dataFromPLC.shiftCounter.output;
            machine.lotCounter.output = dataFromPLC.lotCounter.output;

            machine.status.relaySafety = dataFromPLC.status.relaySafety;
            machine.status.machine = dataFromPLC.status.machine;
            machine.timeWorking.machineOn = dataFromPLC.timeWorking.machineOn;
            machine.timeWorking.machineOff = dataFromPLC.timeWorking.machineOff;

        },
        _Metronic,
        _ICI01,
        _Jinguan01,
        _MPR01,
        _ICI02,
        _Jinguan02,
        _MPR02
    }
}
